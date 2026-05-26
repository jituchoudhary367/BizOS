-- ═══════════════════════════════════════════════════════════
-- Migration 010: WhatsApp Messages
-- ═══════════════════════════════════════════════════════════

CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_type AS ENUM ('text', 'voice', 'image', 'document', 'template');

CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  message_id TEXT,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  direction message_direction NOT NULL DEFAULT 'inbound',
  message_type message_type NOT NULL DEFAULT 'text',
  body TEXT,
  media_url TEXT,
  status TEXT DEFAULT 'received',
  parsed_intent JSONB,
  linked_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_whatsapp_business_id ON whatsapp_messages(business_id);
CREATE INDEX idx_whatsapp_message_id ON whatsapp_messages(message_id);
CREATE INDEX idx_whatsapp_from_number ON whatsapp_messages(business_id, from_number);
CREATE INDEX idx_whatsapp_created_at ON whatsapp_messages(business_id, created_at DESC);

-- RLS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business messages"
  ON whatsapp_messages FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert messages for own business"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own business messages"
  ON whatsapp_messages FOR UPDATE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

-- Trigger
CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;
