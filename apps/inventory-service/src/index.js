const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// BullMQ for background tasks (optional)
let inventoryQueue;
try {
  const { Queue, Worker } = require('bullmq');
  const connection = { connection: { url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' } };
  inventoryQueue = new Queue('inventory', { connection: connection.connection });
  new Worker('inventory', async job => {
    console.log('Inventory job', job.name, job.data);
  }, { connection: connection.connection });
} catch (e) {
  console.warn('BullMQ not available; inventory background jobs disabled');
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
//  PRODUCTS
// ═══════════════════════════════════════════════════════════

// ─── GET /products ─────────────────────────────────────────
app.get('/products', withBusiness, async (req, res) => {
  try {
    const { category, search, low_stock, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select('*, inventory_stock(quantity, reserved_quantity)', { count: 'exact' })
      .eq('business_id', req.businessId)
      .eq('is_active', true)
      .order('name')
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    let result = data;
    if (low_stock === 'true') {
      result = data.filter(p => {
        const stock = p.inventory_stock?.[0];
        return stock && stock.quantity <= p.reorder_level;
      });
    }

    res.json({ data: result, total: count, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /products/:id ─────────────────────────────────────
app.get('/products/:id', withBusiness, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, inventory_stock(*)')
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Product not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /products ────────────────────────────────────────
app.post('/products', withBusiness, async (req, res) => {
  try {
    const {
      name, sku, category, buying_price, selling_price,
      gst_rate = 18, unit = 'piece', reorder_level = 10,
      initial_stock = 0, description, hsn_code, image_url,
    } = req.body;

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        business_id: req.businessId,
        name, sku, category, buying_price, selling_price,
        gst_rate, unit, description, hsn_code, image_url,
        reorder_level,
      })
      .select()
      .single();

    if (error) throw error;

    // Ensure we have a default warehouse
    let { data: warehouse } = await supabase
      .from('warehouses')
      .select('id')
      .eq('business_id', req.businessId)
      .eq('is_primary', true)
      .single();

    if (!warehouse) {
      const { data: newWh } = await supabase
        .from('warehouses')
        .insert({
          business_id: req.businessId,
          name: 'Main Warehouse',
          is_primary: true,
        })
        .select()
        .single();
      warehouse = newWh;
    }

    // Create initial stock record
    if (warehouse) {
      await supabase.from('inventory_stock').insert({
        business_id: req.businessId,
        product_id: product.id,
        warehouse_id: warehouse.id,
        quantity: initial_stock,
        reserved_quantity: 0,
      });
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /products/:id ───────────────────────────────────
app.patch('/products/:id', withBusiness, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  STOCK MANAGEMENT
// ═══════════════════════════════════════════════════════════

// ─── PATCH /products/:id/stock ─────────────────────────────
app.patch('/products/:id/stock', withBusiness, async (req, res) => {
  try {
    const { adjustment, reason = 'manual_adjustment', warehouse_id } = req.body;

    // Get current stock
    let stockQuery = supabase
      .from('inventory_stock')
      .select('*')
      .eq('product_id', req.params.id)
      .eq('business_id', req.businessId);

    if (warehouse_id) {
      stockQuery = stockQuery.eq('warehouse_id', warehouse_id);
    }

    const { data: stock } = await stockQuery.single();
    if (!stock) return res.status(404).json({ error: 'Stock record not found' });

    const newQty = stock.quantity + adjustment;
    if (newQty < 0) return res.status(400).json({ error: 'Insufficient stock' });

    const { data, error } = await supabase
      .from('inventory_stock')
      .update({
        quantity: newQty,
        last_stock_take: new Date().toISOString(),
      })
      .eq('id', stock.id)
      .select()
      .single();

    if (error) throw error;

    // Create audit log
    await supabase.from('stock_adjustments').insert({
      business_id: req.businessId,
      product_id: req.params.id,
      warehouse_id: stock.warehouse_id,
      quantity_delta: adjustment,
      reason,
      performed_by: req.user.id,
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /stock/take ─────────────────────────────────────
app.post('/stock/take', withBusiness, async (req, res) => {
  try {
    const { records } = req.body; // [{ product_id, warehouse_id, quantity }]
    if (!Array.isArray(records)) return res.status(400).json({ error: 'Invalid records array' });

    for (const r of records) {
      const { data: existing } = await supabase
        .from('inventory_stock')
        .select('*')
        .eq('product_id', r.product_id)
        .eq('warehouse_id', r.warehouse_id)
        .eq('business_id', req.businessId)
        .single();

      if (existing) {
        await supabase.from('inventory_stock').update({ quantity: r.quantity }).eq('id', existing.id);
      } else {
        await supabase.from('inventory_stock').insert({
          business_id: req.businessId,
          product_id: r.product_id,
          warehouse_id: r.warehouse_id,
          quantity: r.quantity,
          reserved_quantity: 0,
        });
      }

      await supabase.from('stock_adjustments').insert({
        business_id: req.businessId,
        product_id: r.product_id,
        warehouse_id: r.warehouse_id,
        quantity_delta: r.quantity,
        reason: 'stock_take',
        performed_by: req.user?.id || null,
      });
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /forecast/product ───────────────────────────────
app.post('/forecast/product', withBusiness, async (req, res) => {
  try {
    const { product_id, horizon_days = 30 } = req.body;
    if (!product_id) return res.status(400).json({ error: 'Missing product_id' });

    // Call AI service for forecast (expects AI service to be running locally or configured)
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const resp = await fetch(`${aiUrl}/ai/forecast/product`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: req.businessId, product_id, horizon_days })
    });
    const json = await resp.json();
    res.json(json);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  PURCHASE ORDERS
// ═══════════════════════════════════════════════════════════

// ─── GET /purchase-orders ──────────────────────────────────
app.get('/purchase-orders', withBusiness, async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('purchase_orders')
      .select('*, suppliers(name), purchase_order_items(count)')
      .eq('business_id', req.businessId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /purchase-orders ─────────────────────────────────
app.post('/purchase-orders', withBusiness, async (req, res) => {
  try {
    const { supplier_id, items, expected_date, notes } = req.body;

    // Generate PO number
    const { count } = await supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', req.businessId);

    const poNumber = `PO-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;

    // Calculate total
    const enrichedItems = await Promise.all(items.map(async (item) => {
      const { data: product } = await supabase
        .from('products')
        .select('name, buying_price, gst_rate')
        .eq('id', item.product_id)
        .eq('business_id', req.businessId)
        .single();

      const unitPrice = product?.buying_price || item.unit_price;
      const lineTotal = unitPrice * item.quantity;

      return {
        product_id: item.product_id,
        product_name: product?.name || item.product_name || 'Unknown',
        quantity: item.quantity,
        unit_price: unitPrice,
        tax_rate: product?.gst_rate || 18,
        line_total: lineTotal,
      };
    }));

    const totalAmount = enrichedItems.reduce((sum, i) => sum + i.line_total, 0);

    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        business_id: req.businessId,
        supplier_id,
        po_number: poNumber,
        status: 'draft',
        expected_date,
        total_amount: totalAmount,
        notes,
      })
      .select()
      .single();

    if (poError) throw poError;

    // Create PO items
    await supabase.from('purchase_order_items').insert(
      enrichedItems.map(item => ({ ...item, purchase_order_id: po.id }))
    );

    res.status(201).json(po);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /purchase-orders/:id/receive ────────────────────
app.patch('/purchase-orders/:id/receive', withBusiness, async (req, res) => {
  try {
    const { items } = req.body; // Array of { product_id, received_quantity }

    // Get PO items
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('*, purchase_order_items(*)')
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .single();

    if (!po) return res.status(404).json({ error: 'Purchase order not found' });

    // Update stock for each received item
    for (const item of (items || po.purchase_order_items)) {
      const qty = item.received_quantity || item.quantity;
      await supabase.from('inventory_stock')
        .update({ quantity: supabase.raw(`quantity + ${qty}`) })
        .eq('product_id', item.product_id)
        .eq('business_id', req.businessId);

      // Create stock adjustment
      await supabase.from('stock_adjustments').insert({
        business_id: req.businessId,
        product_id: item.product_id,
        quantity_delta: qty,
        reason: `Received from PO ${po.po_number}`,
        performed_by: req.user.id,
      });
    }

    // Update PO status
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ status: 'received' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /alerts ───────────────────────────────────────────
app.get('/alerts', withBusiness, async (req, res) => {
  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, sku, category, reorder_level, inventory_stock(quantity, reserved_quantity)')
      .eq('business_id', req.businessId)
      .eq('is_active', true);

    const lowStock = (products || []).filter(p => {
      const stock = p.inventory_stock?.[0];
      return stock && stock.quantity <= p.reorder_level;
    });

    res.json({ data: lowStock, count: lowStock.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /stats ────────────────────────────────────────────
app.get('/stats', withBusiness, async (req, res) => {
  try {
    const [total, lowStock] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true })
        .eq('business_id', req.businessId).eq('is_active', true),
      supabase.from('products')
        .select('id, reorder_level, inventory_stock(quantity)')
        .eq('business_id', req.businessId).eq('is_active', true),
    ]);

    const lowCount = (lowStock.data || []).filter(p => {
      const stock = p.inventory_stock?.[0];
      return stock && stock.quantity <= p.reorder_level;
    }).length;

    res.json({
      total_products: total.count || 0,
      low_stock: lowCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Health check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'BizOS Inventory Service' });
});

const PORT = process.env.INVENTORY_PORT || 3002;
app.listen(PORT, () => console.log(`🏬 Inventory Service running on port ${PORT}`));
