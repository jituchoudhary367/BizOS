-- ═══════════════════════════════════════════════════════════
-- Migration 013: Workflow Triggers
-- ═══════════════════════════════════════════════════════════

CREATE TABLE workflow_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  execution_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workflow_triggers_business_id ON workflow_triggers(business_id);
CREATE INDEX idx_workflow_triggers_event_type ON workflow_triggers(business_id, event_type);

-- RLS
ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business triggers"
  ON workflow_triggers FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert triggers for own business"
  ON workflow_triggers FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own business triggers"
  ON workflow_triggers FOR UPDATE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own business triggers"
  ON workflow_triggers FOR DELETE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

-- Trigger
CREATE TRIGGER update_workflow_triggers_updated_at
  BEFORE UPDATE ON workflow_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
