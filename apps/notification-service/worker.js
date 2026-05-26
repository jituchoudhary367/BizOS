const { Worker } = require('bullmq');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const connection = { connection: { url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' } };

new Worker('notifications', async job => {
  console.log('Notification job', job.name, job.data);
  if (job.name === 'send.email') {
    // Placeholder: integrate with Nodemailer/Resend
    console.log('Sending email', job.data);
  }
  if (job.name === 'send.whatsapp') {
    // Proxy to whatsapp-service
    const url = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:3006';
    await fetch(`${url}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(job.data) });
  }
}, connection.connection).on('failed', (job, err) => console.error('Notifications worker failed', job?.id, err?.message));

console.log('Notifications worker started');
