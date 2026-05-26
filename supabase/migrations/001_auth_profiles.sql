-- ═══════════════════════════════════════════════════════════
-- Migration 001: Businesses & Auth Profiles
-- ═══════════════════════════════════════════════════════════

-- Business type enum
CREATE TYPE business_type AS ENUM (
  'wholesale', 'pharmacy', 'restaurant', 'hardware',
  'garment', 'electronics', 'fmcg', 'other'
);

-- Plan enum
CREATE TYPE plan_type AS ENUM ('starter', 'growth', 'enterprise');

-- Role enum
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'staff');

-- ─── Businesses table ──────────────────────────────────────
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type business_type NOT NULL DEFAULT 'other',
  gstin TEXT,
  address TEXT,
  phone TEXT,
  plan plan_type NOT NULL DEFAULT 'starter',
  plan_expires_at TIMESTAMPTZ,
  whatsapp_number TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Profiles table (extends auth.users) ───────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'owner',
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  language_preference TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_profiles_business_id ON profiles(business_id);

-- ─── RLS Policies ──────────────────────────────────────────
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Businesses: users can only see their own business
CREATE POLICY "Users can view own business"
  ON businesses FOR SELECT
  USING (id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Owners can update own business"
  ON businesses FOR UPDATE
  USING (id IN (SELECT business_id FROM profiles WHERE id = auth.uid() AND role = 'owner'));

CREATE POLICY "Anyone can insert business on signup"
  ON businesses FOR INSERT
  WITH CHECK (true);

-- Profiles: users can see profiles in their business
CREATE POLICY "Users can view business profiles"
  ON profiles FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Anyone can insert profile on signup"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ─── Updated_at trigger function ───────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
