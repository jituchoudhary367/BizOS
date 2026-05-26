const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Webhook verification from Meta ───────────────────────
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ─── Webhook POST from Meta ───────────────────────────────
app.post('/webhook', async (req, res) => {
  // Validate signature
  const signature = req.headers['x-hub-signature-256'];
  if (process.env.META_APP_SECRET && signature) {
    const expectedSig = `sha256=${crypto
      .createHmac('sha256', process.env.META_APP_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex')}`;
    if (signature !== expectedSig) return res.sendStatus(403);
  }

  res.sendStatus(200); // Respond immediately per Meta requirements

  // Process in background
  setImmediate(() => processWebhookPayload(req.body));
});

async function processWebhookPayload(body) {
  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const messages = changes?.value?.messages;

    if (!messages?.length) return;

    for (const message of messages) {
      await processMessage(message, changes.value);
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }
}

async function processMessage(message, value) {
  const from = message.from;
  const text = message.text?.body || '';
  const waNumber = value.metadata?.display_phone_number;

  // Find business by WhatsApp number
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('whatsapp_number', `+${waNumber}`)
    .single();

  if (!business) {
    console.warn('No business found for WhatsApp number:', waNumber);
    return;
  }

  // Find or create customer by phone
  let { data: customer } = await supabase
    .from('customers')
    .select('id, name')
    .eq('business_id', business.id)
    .eq('phone', `+${from}`)
    .single();

  if (!customer) {
    // Check whatsapp_number field too
    const { data: waCustomer } = await supabase
      .from('customers')
      .select('id, name')
      .eq('business_id', business.id)
      .eq('whatsapp_number', `+${from}`)
      .single();

    if (waCustomer) {
      customer = waCustomer;
    } else {
      // Auto-create unknown customer
      const profileName = value.contacts?.[0]?.profile?.name || 'Unknown';
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          business_id: business.id,
          name: profileName,
          phone: `+${from}`,
          whatsapp_number: `+${from}`,
        })
        .select()
        .single();
      customer = newCustomer;
    }
  }

  // Determine message type
  let messageType = 'text';
  let mediaUrl = null;
  let body = text;

  if (message.type === 'audio') {
    messageType = 'voice';
    mediaUrl = message.audio?.id; // Media ID — needs download
    body = '[Voice message]';
  } else if (message.type === 'image') {
    messageType = 'image';
    mediaUrl = message.image?.id;
    body = message.image?.caption || '[Image]';
  } else if (message.type === 'document') {
    messageType = 'document';
    mediaUrl = message.document?.id;
    body = message.document?.filename || '[Document]';
  }

  // Store message with correct column names
  const { data: msg } = await supabase
    .from('whatsapp_messages')
    .insert({
      business_id: business.id,
      message_id: message.id,
      from_number: `+${from}`,
      to_number: `+${waNumber}`,
      direction: 'inbound',
      message_type: messageType,
      body: body,
      media_url: mediaUrl,
      status: 'received',
    })
    .select()
    .single();

  // Forward to AI service for intent parsing
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  try {
    const response = await fetch(`${aiServiceUrl}/api/whatsapp/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message_id: msg?.id,
        business_id: business.id,
        customer_id: customer?.id,
        customer_name: customer?.name || 'Unknown',
        text: body,
        phone: from,
      }),
    });

    if (response.ok) {
      const parsed = await response.json();
      // Update message with parsed intent
      if (msg?.id && parsed) {
        await supabase
          .from('whatsapp_messages')
          .update({ parsed_intent: parsed })
          .eq('id', msg.id);

        // If order was created, link it
        if (parsed.order_id) {
          await supabase
            .from('whatsapp_messages')
            .update({ linked_order_id: parsed.order_id })
            .eq('id', msg.id);
        }
      }
    } else {
      console.error('AI parsing failed:', await response.text());
    }
  } catch (error) {
    console.error('AI service connection error:', error.message);
  }
}

// ─── POST /send ────────────────────────────────────────────
app.post('/send', async (req, res) => {
  try {
    const { to, message, business_id, template, parameters } = req.body;

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!phoneNumberId || phoneNumberId === 'your-phone-number-id') {
      return res.status(503).json({ error: 'WhatsApp API not configured' });
    }

    let body;
    if (template) {
      body = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: 'en' },
          components: parameters ? [{
            type: 'body',
            parameters: parameters.map(p => ({ type: 'text', text: p })),
          }] : [],
        },
      };
    } else {
      body = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message, preview_url: false },
      };
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    // Store outbound message
    if (data.messages?.[0]?.id && business_id) {
      // Find business WhatsApp number
      const { data: biz } = await supabase
        .from('businesses')
        .select('whatsapp_number')
        .eq('id', business_id)
        .single();

      await supabase.from('whatsapp_messages').insert({
        business_id,
        message_id: data.messages[0].id,
        from_number: biz?.whatsapp_number || 'business',
        to_number: to.startsWith('+') ? to : `+${to}`,
        direction: 'outbound',
        message_type: template ? 'template' : 'text',
        body: message || template,
        status: 'sent',
      });
    }

    res.status(response.ok ? 200 : 400).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Health check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'BizOS WhatsApp Service' });
});

const PORT = process.env.WHATSAPP_PORT || 3006;
app.listen(PORT, () => console.log(`💬 WhatsApp Service running on port ${PORT}`));
