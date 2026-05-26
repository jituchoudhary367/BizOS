-- ═══════════════════════════════════════════════════════════
-- Migration 007: Ledger & Payments
-- ═══════════════════════════════════════════════════════════

CREATE TYPE payment_method AS ENUM ('cash', 'upi', 'bank_transfer', 'cheque', 'razorpay');
CREATE TYPE ledger_entry_type AS ENUM ('debit', 'credit');
CREATE TYPE ledger_entity_type AS ENUM ('customer', 'supplier');

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  method payment_method NOT NULL DEFAULT 'cash',
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  entity_type ledger_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  entry_type ledger_entry_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_payments_business_id ON payments(business_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_ledger_business_id ON ledger_entries(business_id);
CREATE INDEX idx_ledger_entity ON ledger_entries(business_id, entity_type, entity_id);
CREATE INDEX idx_ledger_created_at ON ledger_entries(business_id, created_at DESC);

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business payments"
  ON payments FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert payments for own business"
  ON payments FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own business payments"
  ON payments FOR UPDATE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own business ledger"
  ON ledger_entries FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert ledger entries for own business"
  ON ledger_entries FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

-- Triggers
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
