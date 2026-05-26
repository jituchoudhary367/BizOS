-- ═══════════════════════════════════════════════════════════
-- Migration 011: AI Conversations
-- ═══════════════════════════════════════════════════════════

CREATE TYPE conversation_status AS ENUM ('active', 'resolved');

CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New conversation',
  messages JSONB[] DEFAULT '{}',
  context JSONB DEFAULT '{}',
  last_agent TEXT,
  status conversation_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_conversations_business_id ON ai_conversations(business_id);
CREATE INDEX idx_ai_conversations_profile_id ON ai_conversations(profile_id);
CREATE INDEX idx_ai_conversations_session_id ON ai_conversations(session_id);

-- RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON ai_conversations FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON ai_conversations FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON ai_conversations FOR DELETE
  USING (profile_id = auth.uid());

-- Trigger
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
