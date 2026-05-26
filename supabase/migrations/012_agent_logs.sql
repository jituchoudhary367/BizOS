-- ═══════════════════════════════════════════════════════════
-- Migration 012: Agent Logs
-- ═══════════════════════════════════════════════════════════

CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  duration_ms INT NOT NULL DEFAULT 0,
  llm_model TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error TEXT,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_agent_logs_business_id ON agent_logs(business_id);
CREATE INDEX idx_agent_logs_agent_name ON agent_logs(business_id, agent_name);
CREATE INDEX idx_agent_logs_created_at ON agent_logs(business_id, created_at DESC);
CREATE INDEX idx_agent_logs_conversation_id ON agent_logs(conversation_id);

-- RLS
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business agent logs"
  ON agent_logs FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Service can insert agent logs"
  ON agent_logs FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));
