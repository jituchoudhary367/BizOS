const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// BullMQ for background jobs (opt-in via ENABLE_WORKERS=true)
let financeQueue;
if (process.env.ENABLE_WORKERS === 'true' && process.env.REDIS_URL) {
  try {
    const { Queue, Worker } = require('bullmq');
    const connection = { connection: { url: process.env.REDIS_URL } };
    financeQueue = new Queue('finance', { connection: connection.connection });
    new Worker('finance', async (job) => {
      console.log('Finance job', job.name, job.data);
    }, { connection: connection.connection });
  } catch (e) {
    console.warn('BullMQ not available; finance background jobs disabled');
  }
} else {
  console.warn('BullMQ disabled; set ENABLE_WORKERS=true and REDIS_URL to enable finance background jobs');
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const withBusiness = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  const { data: profile } = await supabase.from('profiles').select('business_id, role').eq('id', user.id).single();
  req.user = user;
  req.businessId = profile?.business_id;
  req.userRole = profile?.role;
  next();
};

// ═══════════════════════════════════════════════════════════
//  INVOICES
// ═══════════════════════════════════════════════════════════

// ─── GET /invoices ─────────────────────────────────────────
app.get('/invoices', withBusiness, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('invoices')
      .select('*, customers(name, phone)', { count: 'exact' })
      .eq('business_id', req.businessId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, total: count, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /invoices ────────────────────────────────────────
app.post('/invoices', withBusiness, async (req, res) => {
  try {
    const { order_id, due_days = 30 } = req.body;

    // Fetch order
    const { data: order } = await supabase
      .from('orders')
      .select('*, customers(*), order_items(*, products(name, hsn_code, gst_rate))')
      .eq('id', order_id)
      .eq('business_id', req.businessId)
      .single();

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Generate invoice number
    const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('business_id', req.businessId);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;

    // Compute taxes — intra-state = CGST+SGST, inter-state = IGST
    const isIntraState = true; // TODO: compare business state vs customer state
    const cgst = isIntraState ? order.tax_amount / 2 : 0;
    const sgst = isIntraState ? order.tax_amount / 2 : 0;
    const igst = isIntraState ? 0 : order.tax_amount;

    const dueDate = new Date(Date.now() + due_days * 86400000).toISOString().split('T')[0];

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        business_id: req.businessId,
        order_id,
        customer_id: order.customer_id,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: dueDate,
        status: 'draft',
        subtotal: order.total_amount - order.tax_amount,
        tax_amount: order.tax_amount,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        total_amount: order.total_amount,
      })
      .select()
      .single();

    if (error) throw error;
    // Note: The trg_create_ledger_on_invoice trigger auto-creates the ledger entry
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /invoices/:id/send ──────────────────────────────
app.patch('/invoices/:id/send', withBusiness, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .select('*, customers(name, phone, whatsapp_number)')
      .single();

    if (error) throw error;

    // TODO: trigger WhatsApp send via notification-service
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  PAYMENTS
// ═══════════════════════════════════════════════════════════

// ─── POST /payments ────────────────────────────────────────
app.post('/payments', withBusiness, async (req, res) => {
  try {
    const { invoice_id, customer_id, amount, method = 'cash', reference_number, notes, payment_date } = req.body;

    // Validate invoice if provided
    if (invoice_id) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoice_id)
        .eq('business_id', req.businessId)
        .single();

      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        business_id: req.businessId,
        invoice_id,
        customer_id: customer_id || null,
        amount,
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        method,
        reference_number,
        notes,
      })
      .select()
      .single();

    if (error) throw error;
    // Note: The trg_create_ledger_on_payment trigger auto-creates ledger entry + updates invoice
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /payments ─────────────────────────────────────────
app.get('/payments', withBusiness, async (req, res) => {
  try {
    const { invoice_id, customer_id } = req.query;
    let query = supabase
      .from('payments')
      .select('*, invoices(invoice_number), customers(name)')
      .eq('business_id', req.businessId)
      .order('created_at', { ascending: false });

    if (invoice_id) query = query.eq('invoice_id', invoice_id);
    if (customer_id) query = query.eq('customer_id', customer_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  LEDGER
// ═══════════════════════════════════════════════════════════

// ─── GET /ledger ───────────────────────────────────────────
app.get('/ledger', withBusiness, async (req, res) => {
  try {
    const { entity_type, entity_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('ledger_entries')
      .select('*', { count: 'exact' })
      .eq('business_id', req.businessId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (entity_type) query = query.eq('entity_type', entity_type);
    if (entity_id) query = query.eq('entity_id', entity_id);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data, total: count, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Convenience route: GET /ledger/:entity_type/:entity_id
app.get('/ledger/:entity_type/:entity_id', withBusiness, async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('business_id', req.businessId)
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  CASHFLOW
// ═══════════════════════════════════════════════════════════

// ─── GET /cashflow/summary ─────────────────────────────────
app.get('/cashflow/summary', withBusiness, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    const startDate = period === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      : new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];

    // Credits = income, Debits = obligations
    const { data: entries } = await supabase
      .from('ledger_entries')
      .select('entry_type, amount')
      .eq('business_id', req.businessId)
      .gte('created_at', `${startDate}T00:00:00`);

    const credits = (entries || []).filter(e => e.entry_type === 'credit').reduce((s, e) => s + (e.amount || 0), 0);
    const debits = (entries || []).filter(e => e.entry_type === 'debit').reduce((s, e) => s + (e.amount || 0), 0);

    // Payments received (actual income)
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('business_id', req.businessId)
      .gte('payment_date', startDate);

    const income = (payments || []).reduce((s, p) => s + (p.amount || 0), 0);

    res.json({ income, credits, debits, net: credits - debits, period });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  COLLECTIONS
// ═══════════════════════════════════════════════════════════

// ─── GET /collections/outstanding ─────────────────────────
app.get('/collections/outstanding', withBusiness, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customers(name, phone, email, whatsapp_number, risk_score)')
      .eq('business_id', req.businessId)
      .in('status', ['sent', 'overdue'])
      .order('due_date');

    if (error) throw error;

    const today = new Date();
    const enriched = (data || []).map(inv => ({
      ...inv,
      days_overdue: Math.max(0, Math.floor((today - new Date(inv.due_date)) / 86400000)),
    }));

    res.json({
      data: enriched,
      total_outstanding: enriched.reduce((s, i) => s + (i.total_amount - (i.paid_amount || 0)), 0),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /collections/remind/:customer_id ────────────────
app.post('/collections/remind/:customer_id', withBusiness, async (req, res) => {
  try {
    const { data: customer } = await supabase
      .from('customers')
      .select('name, phone, whatsapp_number, outstanding_balance')
      .eq('id', req.params.customer_id)
      .eq('business_id', req.businessId)
      .single();

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Get overdue invoices for customer
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, paid_amount, due_date')
      .eq('customer_id', req.params.customer_id)
      .eq('business_id', req.businessId)
      .in('status', ['sent', 'overdue']);

    const message = `Dear ${customer.name}, you have outstanding invoices totaling ₹${customer.outstanding_balance?.toLocaleString()}. Please arrange payment at your earliest. — BizOS`;

    // Store reminder
    await supabase.from('collection_reminders').insert({
      business_id: req.businessId,
      customer_id: req.params.customer_id,
      invoice_ids: (invoices || []).map(i => i.id),
      channel: 'whatsapp',
      message,
    });

    // TODO: call WhatsApp service to actually send
    res.json({ status: 'queued', message, customer: customer.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /stats ────────────────────────────────────────────
app.get('/stats', withBusiness, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [pendingInvoices, overdueInvoices, todayPayments] = await Promise.all([
      supabase.from('invoices').select('total_amount, paid_amount')
        .eq('business_id', req.businessId).in('status', ['sent', 'draft']),
      supabase.from('invoices').select('total_amount, paid_amount')
        .eq('business_id', req.businessId).eq('status', 'overdue'),
      supabase.from('payments').select('amount')
        .eq('business_id', req.businessId).eq('payment_date', today),
    ]);

    const pending = (pendingInvoices.data || []).reduce((s, i) => s + (i.total_amount - (i.paid_amount || 0)), 0);
    const overdue = (overdueInvoices.data || []).reduce((s, i) => s + (i.total_amount - (i.paid_amount || 0)), 0);
    const todayIncome = (todayPayments.data || []).reduce((s, p) => s + (p.amount || 0), 0);

    res.json({
      pending_receivables: pending,
      overdue_amount: overdue,
      overdue_count: overdueInvoices.data?.length || 0,
      today_collections: todayIncome,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Health check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'BizOS Finance Service' });
});

const PORT = process.env.FINANCE_PORT || 3003;
app.listen(PORT, () => console.log(`💰 Finance Service running on port ${PORT}`));
