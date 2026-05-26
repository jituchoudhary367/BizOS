const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Middleware: extract business context ──────────────────
const withBusiness = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  if (process.env.INTERNAL_SERVICE_KEY && token === process.env.INTERNAL_SERVICE_KEY) {
    const internalBusinessId = req.body?.business_id || req.headers['x-business-id'];
    if (!internalBusinessId) {
      return res.status(400).json({ error: 'business_id required for internal request' });
    }

    req.user = { id: 'internal-service' };
    req.businessId = internalBusinessId;
    req.userRole = 'system';
    req.profileId = 'internal-service';
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
  req.profileId = user.id;
  next();
};

// ═══════════════════════════════════════════════════════════
//  INTERNAL NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

// ─── GET /notifications ───────────────────────────────────
app.get('/notifications', withBusiness, async (req, res) => {
  try {
    const { unread_only, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('profile_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Count unread
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', req.user.id)
      .eq('is_read', false);

    res.json({ data, total: count, unread: unreadCount || 0, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /notifications/internal ─────────────────────────
app.post('/notifications/internal', withBusiness, async (req, res) => {
  try {
    const { profile_id, title, body, type = 'info', action_url, metadata = {} } = req.body;

    const targetProfileId = profile_id || req.user.id;

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        business_id: req.businessId,
        profile_id: targetProfileId,
        title,
        body,
        type,
        action_url,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /notifications/broadcast ────────────────────────
app.post('/notifications/broadcast', withBusiness, async (req, res) => {
  try {
    const { title, body, type = 'info', action_url, metadata = {} } = req.body;

    // Get all profiles in this business
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('business_id', req.businessId);

    if (!profiles?.length) {
      return res.json({ sent: 0 });
    }

    const notifications = profiles.map(p => ({
      business_id: req.businessId,
      profile_id: p.id,
      title,
      body,
      type,
      action_url,
      metadata,
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) throw error;
    res.status(201).json({ sent: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /notifications/:id/read ────────────────────────
app.patch('/notifications/:id/read', withBusiness, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('profile_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /notifications/read-all ────────────────────────
app.patch('/notifications/read-all', withBusiness, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('profile_id', req.user.id)
      .eq('is_read', false)
      .select();

    if (error) throw error;
    res.json({ updated: data?.length || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  WHATSAPP NOTIFICATIONS (proxy to WhatsApp service)
// ═══════════════════════════════════════════════════════════

// ─── POST /notifications/whatsapp ─────────────────────────
app.post('/notifications/whatsapp', withBusiness, async (req, res) => {
  try {
    const { to, message, template, parameters } = req.body;
    const waServiceUrl = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:3006';

    const response = await fetch(`${waServiceUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        message,
        template,
        parameters,
        business_id: req.businessId,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'WhatsApp send failed');

    res.json(data);
  } catch (error) {
    console.error('WhatsApp notification error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /whatsapp/conversations?phone=... - return messages for a phone number (inbound/outbound)
app.get('/whatsapp/conversations', withBusiness, async (req, res) => {
  try {
    const { phone, limit = 100 } = req.query;
    if (!phone) return res.status(400).json({ error: 'phone query param required' });

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .or(`from_number.eq.${phone},to_number.eq.${phone}`)
      .eq('business_id', req.businessId)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /whatsapp/messages - insert incoming/outgoing whatsapp message (internal)
app.post('/whatsapp/messages', withBusiness, async (req, res) => {
  try {
    const payload = req.body || {};
    const insert = {
      business_id: req.businessId,
      message_id: payload.message_id || null,
      from_number: payload.from_number,
      to_number: payload.to_number,
      direction: payload.direction || 'inbound',
      message_type: payload.message_type || 'text',
      body: payload.body || null,
      media_url: payload.media_url || null,
      status: payload.status || 'received',
      parsed_intent: payload.parsed_intent || null,
      linked_order_id: payload.linked_order_id || null,
      created_at: payload.created_at || new Date().toISOString(),
    };

    const { data, error } = await supabase.from('whatsapp_messages').insert(insert).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  EMAIL NOTIFICATIONS (placeholder — Nodemailer/Resend)
// ═══════════════════════════════════════════════════════════

// ─── POST /notifications/email ────────────────────────────
app.post('/notifications/email', withBusiness, async (req, res) => {
  try {
    const { to, subject, body, html } = req.body;

    // TODO: Wire up Nodemailer or Resend when SMTP credentials are provided
    // For now, log and return success
    console.log(`📧 Email queued: to=${to}, subject=${subject}`);

    // Store as internal notification too
    await supabase.from('notifications').insert({
      business_id: req.businessId,
      profile_id: req.user.id,
      title: `Email sent: ${subject}`,
      body: `Email to ${to} queued for delivery.`,
      type: 'info',
      metadata: { channel: 'email', to, subject },
    });

    res.json({ status: 'queued', to, subject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /stats ───────────────────────────────────────────
app.get('/stats', withBusiness, async (req, res) => {
  try {
    const { count: unread } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', req.user.id)
      .eq('is_read', false);

    const { count: total } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', req.user.id);

    res.json({ unread: unread || 0, total: total || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Health check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'BizOS Notification Service' });
});

const PORT = process.env.NOTIFICATION_PORT || 3005;
app.listen(PORT, () => console.log(`🔔 Notification Service running on port ${PORT}`));
