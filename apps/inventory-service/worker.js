const { Worker } = require('bullmq');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const connection = { connection: { url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' } };

new Worker('inventory', async job => {
  console.log('Inventory job', job.name, job.data);
  if (job.name === 'auto.po.generate') {
    // Placeholder for auto PO generation
    const { business_id } = job.data;
    // Query low stock and create draft POs
    const { data: low } = await supabase.from('inventory_stock').select('product_id, quantity, reorder_level').lt('quantity', 'reorder_level').eq('business_id', business_id);
    if (low?.length) {
      // create a PO draft (aggregate by supplier not implemented)
      await supabase.from('purchase_orders').insert({ business_id, supplier_id: null, po_number: `AUTO-${Date.now()}`, status: 'draft', total_amount: 0, notes: 'Auto-generated PO' });
    }
  }
}, connection.connection).on('failed', (job, err) => console.error('Inventory worker failed', job?.id, err?.message));

console.log('Inventory worker started');
