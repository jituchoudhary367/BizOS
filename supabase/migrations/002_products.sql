-- ═══════════════════════════════════════════════════════════
-- Migration 002: Products
-- ═══════════════════════════════════════════════════════════

CREATE TYPE product_unit AS ENUM ('kg', 'piece', 'litre', 'box', 'pack', 'metre', 'dozen', 'bag');

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  sku TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit product_unit NOT NULL DEFAULT 'piece',
  buying_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  hsn_code TEXT,
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  reorder_level INT NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_products_sku ON products(business_id, sku);
CREATE INDEX idx_products_category ON products(business_id, category);
CREATE UNIQUE INDEX idx_products_unique_sku ON products(business_id, sku) WHERE sku IS NOT NULL;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business products"
  ON products FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert products for own business"
  ON products FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own business products"
  ON products FOR UPDATE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own business products"
  ON products FOR DELETE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
