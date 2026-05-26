const { Worker } = require('bullmq');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const connection = { connection: { url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' } };

new Worker('finance', async job => {
  console.log('Finance job', job.name, job.data);
  if (job.name === 'collections.auto_followup') {
    // Placeholder: send reminders
    const { customer_id } = job.data;
    await supabase.from('notifications').insert({ business_id: job.data.business_id, type: 'collection', recipient_id: customer_id, payload: { note: 'Automated reminder' }, created_at: new Date().toISOString() });
  }
}, connection.connection).on('failed', (job, err) => console.error('Finance worker failed', job?.id, err?.message));

console.log('Finance worker started');
