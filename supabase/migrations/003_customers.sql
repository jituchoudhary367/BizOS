-- ═══════════════════════════════════════════════════════════
-- Migration 003: Customers & Suppliers
-- ═══════════════════════════════════════════════════════════

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp_number TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  gstin TEXT,
  credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
  outstanding_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  risk_score DECIMAL(3,2) NOT NULL DEFAULT 0,
  payment_terms_days INT NOT NULL DEFAULT 30,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp_number TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  gstin TEXT,
  credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
  outstanding_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  risk_score DECIMAL(3,2) NOT NULL DEFAULT 0,
  payment_terms_days INT NOT NULL DEFAULT 30,
  lead_time_days INT NOT NULL DEFAULT 7,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_customers_business_id ON customers(business_id);
CREATE INDEX idx_customers_phone ON customers(business_id, phone);
CREATE INDEX idx_customers_whatsapp ON customers(business_id, whatsapp_number);
CREATE INDEX idx_suppliers_business_id ON suppliers(business_id);

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business customers"
  ON customers FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert customers for own business"
  ON customers FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own business customers"
  ON customers FOR UPDATE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own business customers"
  ON customers FOR DELETE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own business suppliers"
  ON suppliers FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert suppliers for own business"
  ON suppliers FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own business suppliers"
  ON suppliers FOR UPDATE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own business suppliers"
  ON suppliers FOR DELETE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

-- Triggers
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
