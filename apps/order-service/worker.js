const { Worker, Queue } = require('bullmq');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const connection = { connection: { url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' } };

const worker = new Worker('orders', async job => {
  console.log('Order worker processing', job.name, job.data);
  if (job.name === 'order.created') {
    // e.g., send notification to business
    const { order_id, business_id } = job.data;
    // Fetch order and customer
    const { data: order } = await supabase.from('orders').select('*, customers(name, phone)').eq('id', order_id).single();
    if (order) {
      await supabase.from('notifications').insert({ business_id, type: 'order', recipient_id: null, payload: { order_id, order_number: order.order_number }, created_at: new Date().toISOString() });
    }
  }
  if (job.name === 'order.status_changed') {
    // Placeholder: handle status change
    console.log('Order status changed', job.data);
  }
}, connection.connection);

worker.on('failed', (job, err) => {
  console.error('Worker job failed', job?.id, err?.message);
});

console.log('Order worker started');
