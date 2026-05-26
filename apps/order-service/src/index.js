const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Optional: BullMQ for background jobs (opt-in via ENABLE_WORKERS=true)
let orderQueue;
if (process.env.ENABLE_WORKERS === 'true' && process.env.REDIS_URL) {
  try {
    const { Queue, Worker } = require('bullmq');
    const connection = { connection: { url: process.env.REDIS_URL } };
    orderQueue = new Queue('orders', { connection: connection.connection });
    // example worker (no-op by default)
    new Worker('orders', async (job) => {
      console.log('Processing job', job.name, job.data);
    }, { connection: connection.connection });
  } catch (e) {
    console.warn('BullMQ not available; background jobs disabled');
  }
} else {
  console.warn('BullMQ disabled; set ENABLE_WORKERS=true and REDIS_URL to enable background jobs');
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Middleware: extract business context ──────────────────
const withBusiness = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  // Internal service-to-service calls can bypass Supabase user JWT validation.
  if (process.env.INTERNAL_SERVICE_KEY && token === process.env.INTERNAL_SERVICE_KEY) {
    const internalBusinessId = req.body?.business_id || req.headers['x-business-id'];
    if (!internalBusinessId) {
      return res.status(400).json({ error: 'business_id required for internal request' });
    }

    req.user = { id: 'internal-service' };
    req.businessId = internalBusinessId;
    req.userRole = 'system';
    return next();
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id, role')
    .eq('id', user.id)
    .single();

  req.user = user;
  req.businessId = profile?.business_id;
  req.userRole = profile?.role;
  next();
};

// ─── GET /orders ───────────────────────────────────────────
app.get('/orders', withBusiness, async (req, res) => {
  try {
    const { status, source, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select('*, customers(name, phone), order_items(* )', { count: 'exact' })
      .eq('business_id', req.businessId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (source) query = query.eq('source', source);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data, total: count, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /orders/:id ───────────────────────────────────────
app.get('/orders/:id', withBusiness, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(*), order_items(*, products(name, sku, unit)), invoices(*)')
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Order not found' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /orders ──────────────────────────────────────────
app.post('/orders', withBusiness, async (req, res) => {
  try {
    const { customer_id, items, source = 'manual', notes, delivery_date } = req.body;

    // Validate customer belongs to business
    const { data: customer } = await supabase
      .from('customers')
      .select('id, payment_terms_days, credit_limit, outstanding_balance')
      .eq('id', customer_id)
      .eq('business_id', req.businessId)
      .single();

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Compute totals
    let subtotal = 0;
    let taxAmount = 0;

    const enrichedItems = await Promise.all(items.map(async (item) => {
      const { data: product } = await supabase
        .from('products')
        .select('name, selling_price, gst_rate')
        .eq('id', item.product_id)
        .eq('business_id', req.businessId)
        .single();

      const unitPrice = product?.selling_price || item.unit_price;
      const lineTotal = unitPrice * item.quantity;
      const taxRate = product?.gst_rate || 18;
      const lineTax = lineTotal * (taxRate / 100);
      subtotal += lineTotal;
      taxAmount += lineTax;

      return {
        product_id: item.product_id,
        product_name: product?.name || item.product_name || 'Unknown',
        quantity: item.quantity,
        unit_price: unitPrice,
        tax_rate: taxRate,
        line_total: lineTotal,
      };
    }));

    // Credit limit check
    const orderTotal = subtotal + taxAmount;
    if (customer.credit_limit > 0 && (customer.outstanding_balance + orderTotal) > customer.credit_limit) {
      return res.status(400).json({
        error: 'Credit limit exceeded',
        credit_limit: customer.credit_limit,
        outstanding: customer.outstanding_balance,
        order_total: orderTotal,
      });
    }

    // Generate order number
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', req.businessId);

    const orderNumber = `ORD-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        business_id: req.businessId,
        customer_id,
        order_number: orderNumber,
        status: 'pending',
        source,
        total_amount: orderTotal,
        tax_amount: taxAmount,
        notes,
        delivery_date,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const { error: itemsError } = await supabase.from('order_items').insert(
      enrichedItems.map(item => ({ ...item, order_id: order.id }))
    );
    if (itemsError) console.error('Order items insert error:', itemsError);

    // Reserve inventory (call RPC)
    await Promise.all(enrichedItems.map(item =>
      supabase.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })
    ));

    // Enqueue background job for order.created
    if (orderQueue) {
      await orderQueue.add('order.created', { order_id: order.id, business_id: req.businessId });
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /orders/whatsapp/webhook ─────────────────────────
// Minimal webhook that accepts { from, body, items } and creates an order
app.post('/orders/whatsapp/webhook', async (req, res) => {
  try {
    const { from, items, notes, business_id: requestedBusinessId } = req.body;
    if (!from || !items) return res.status(400).json({ error: 'Missing from or items' });

    const normalizePhone = (value) => (value || '').toString().replace(/\s+/g, '').replace(/[^\d+]/g, '');
    const inboundPhone = normalizePhone(from);

    let businessId = requestedBusinessId || null;
    if (!businessId) {
      const businessPhone = normalizePhone(process.env.WHATSAPP_NUMBER || '');
      if (businessPhone) {
        const { data: businessByPhone } = await supabase
          .from('businesses')
          .select('id')
          .eq('whatsapp_number', businessPhone)
          .single();
        businessId = businessByPhone?.id || null;
      }
    }

    if (!businessId) {
      return res.status(400).json({ error: 'business_id required for WhatsApp webhook' });
    }

    // Find customer by phone (supports phone and whatsapp_number)
    let { data: customer } = await supabase
      .from('customers')
      .select('id, business_id')
      .eq('business_id', businessId)
      .eq('phone', inboundPhone)
      .single();

    if (!customer) {
      const { data: waCustomer } = await supabase
        .from('customers')
        .select('id, business_id')
        .eq('business_id', businessId)
        .eq('whatsapp_number', inboundPhone)
        .single();
      customer = waCustomer;
    }

    if (!customer) {
      const { data: createdCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          business_id: businessId,
          name: 'WhatsApp Customer',
          phone: inboundPhone,
          whatsapp_number: inboundPhone,
        })
        .select('id, business_id')
        .single();

      if (createError) throw createError;
      customer = createdCustomer;
    }

    // Persist incoming WhatsApp message into whatsapp_messages table for audit/history
    try {
      await supabase.from('whatsapp_messages').insert({
        business_id: businessId,
        from_number: inboundPhone,
        to_number: process.env.WHATSAPP_NUMBER || 'unknown',
        direction: 'inbound',
        message_type: 'text',
        body: notes || null,
        status: 'received',
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Failed to persist whatsapp message:', err.message || err);
    }

    // Build a minimal order payload and forward to internal create flow by calling this service's endpoint
    // Reuse internal logic by calling the POST /orders route programmatically
    const createResp = await fetch(`http://localhost:${process.env.ORDER_PORT || 3001}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.INTERNAL_SERVICE_KEY || ''}` },
      body: JSON.stringify({ customer_id: customer.id, items, source: 'whatsapp', notes, business_id: businessId })
    });

    const result = await createResp.json();
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /orders/:id/status ──────────────────────────────
app.patch('/orders/:id/status', withBusiness, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    // State machine validation
    const { data: current } = await supabase
      .from('orders')
      .select('status')
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .single();

    if (!current) return res.status(404).json({ error: 'Order not found' });

    const transitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['dispatched', 'cancelled'],
      dispatched: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    if (!transitions[current.status]?.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from ${current.status} to ${status}`,
        allowed: transitions[current.status],
      });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .select()
      .single();

    if (error) throw error;
    // Enqueue status change job
    if (orderQueue) await orderQueue.add('order.status_changed', { order_id: data.id, status });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /stats ─────────────────────────────────────────────
app.get('/stats', withBusiness, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [pending, todayOrders, totalOrders] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true })
        .eq('business_id', req.businessId).eq('status', 'pending'),
      supabase.from('orders').select('total_amount')
        .eq('business_id', req.businessId).gte('created_at', `${today}T00:00:00`),
      supabase.from('orders').select('*', { count: 'exact', head: true })
        .eq('business_id', req.businessId),
    ]);

    const todayRevenue = (todayOrders.data || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);

    res.json({
      pending_orders: pending.count || 0,
      today_revenue: todayRevenue,
      total_orders: totalOrders.count || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Health check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'BizOS Order Service' });
});

const PORT = process.env.ORDER_PORT || 3001;
app.listen(PORT, () => console.log(`📦 Order Service running on port ${PORT}`));
