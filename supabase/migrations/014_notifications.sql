-- ═══════════════════════════════════════════════════════════
-- Migration 014: Notifications & AI Insights
-- ═══════════════════════════════════════════════════════════

CREATE TYPE notification_type AS ENUM ('alert', 'info', 'action', 'ai_insight');
CREATE TYPE insight_severity AS ENUM ('info', 'warning', 'critical');

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type notification_type NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity insight_severity NOT NULL DEFAULT 'info',
  data JSONB DEFAULT '{}',
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notifications_business_id ON notifications(business_id);
CREATE INDEX idx_notifications_profile_id ON notifications(profile_id);
CREATE INDEX idx_notifications_unread ON notifications(profile_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(business_id, created_at DESC);
CREATE INDEX idx_ai_insights_business_id ON ai_insights(business_id);
CREATE INDEX idx_ai_insights_type ON ai_insights(business_id, insight_type);
CREATE INDEX idx_ai_insights_active ON ai_insights(business_id, is_dismissed) WHERE is_dismissed = false;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Users can view own business insights"
  ON ai_insights FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Service can insert insights"
  ON ai_insights FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own business insights"
  ON ai_insights FOR UPDATE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

-- Trigger
CREATE TRIGGER update_ai_insights_updated_at
  BEFORE UPDATE ON ai_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_insights;
