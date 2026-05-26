-- ═══════════════════════════════════════════════════════════
-- Migration 005: Inventory (Warehouses + Stock)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inventory_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
  reserved_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
  batch_number TEXT,
  expiry_date DATE,
  last_stock_take TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_warehouses_business_id ON warehouses(business_id);
CREATE INDEX idx_inventory_stock_business_id ON inventory_stock(business_id);
CREATE INDEX idx_inventory_stock_product_id ON inventory_stock(product_id);
CREATE INDEX idx_inventory_stock_warehouse_id ON inventory_stock(warehouse_id);
CREATE UNIQUE INDEX idx_inventory_stock_unique ON inventory_stock(product_id, warehouse_id, batch_number);

-- RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business warehouses"
  ON warehouses FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert warehouses for own business"
  ON warehouses FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own business warehouses"
  ON warehouses FOR UPDATE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own business stock"
  ON inventory_stock FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert stock for own business"
  ON inventory_stock FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own business stock"
  ON inventory_stock FOR UPDATE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

-- Triggers
CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_stock_updated_at
  BEFORE UPDATE ON inventory_stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_stock;
