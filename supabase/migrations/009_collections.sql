-- ═══════════════════════════════════════════════════════════
-- Migration 009: Tasks & Collections
-- ═══════════════════════════════════════════════════════════

CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'overdue');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchase Orders
CREATE TYPE po_status AS ENUM ('draft', 'sent', 'received', 'partial', 'cancelled');

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  po_number TEXT NOT NULL,
  status po_status NOT NULL DEFAULT 'draft',
  expected_date DATE,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tasks_business_id ON tasks(business_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(business_id, status);
CREATE UNIQUE INDEX idx_po_number ON purchase_orders(business_id, po_number);
CREATE INDEX idx_po_business_id ON purchase_orders(business_id);
CREATE INDEX idx_po_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_po_items_po_id ON purchase_order_items(purchase_order_id);

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business tasks"
  ON tasks FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert tasks for own business"
  ON tasks FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own business tasks"
  ON tasks FOR UPDATE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own business tasks"
  ON tasks FOR DELETE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own business POs"
  ON purchase_orders FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert POs for own business"
  ON purchase_orders FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own business POs"
  ON purchase_orders FOR UPDATE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view PO items"
  ON purchase_order_items FOR SELECT
  USING (purchase_order_id IN (SELECT id FROM purchase_orders WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Users can insert PO items"
  ON purchase_order_items FOR INSERT
  WITH CHECK (purchase_order_id IN (SELECT id FROM purchase_orders WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())));

-- Triggers
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
