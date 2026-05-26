-- ═══════════════════════════════════════════════════════════
-- Migration 008: Staff Members & Attendance
-- ═══════════════════════════════════════════════════════════

CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'half_day');

CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  designation TEXT,
  department TEXT,
  salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status attendance_status NOT NULL DEFAULT 'present',
  location_lat DECIMAL(9,6),
  location_lng DECIMAL(9,6),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_staff_business_id ON staff_members(business_id);
CREATE INDEX idx_attendance_business_id ON attendance(business_id);
CREATE INDEX idx_attendance_staff_date ON attendance(staff_id, date);
CREATE UNIQUE INDEX idx_attendance_unique ON attendance(staff_id, date);

-- RLS
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business staff"
  ON staff_members FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert staff for own business"
  ON staff_members FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own business staff"
  ON staff_members FOR UPDATE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own business attendance"
  ON attendance FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert attendance for own business"
  ON attendance FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own business attendance"
  ON attendance FOR UPDATE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

-- Triggers
CREATE TRIGGER update_staff_members_updated_at
  BEFORE UPDATE ON staff_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
