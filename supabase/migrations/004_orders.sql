-- ═══════════════════════════════════════════════════════════
-- Migration 004: Orders & Order Items
-- ═══════════════════════════════════════════════════════════

CREATE TYPE order_source AS ENUM ('whatsapp', 'manual', 'api', 'voice');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  source order_source NOT NULL DEFAULT 'manual',
  status order_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  whatsapp_message_id TEXT,
  delivery_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX idx_orders_number ON orders(business_id, order_number);
CREATE INDEX idx_orders_business_id ON orders(business_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(business_id, status);
CREATE INDEX idx_orders_created_at ON orders(business_id, created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business orders"
  ON orders FOR SELECT
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert orders for own business"
  ON orders FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own business orders"
  ON orders FOR UPDATE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own business orders"
  ON orders FOR DELETE
  USING (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view order items via order"
  ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Users can insert order items via order"
  ON order_items FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Users can update order items via order"
  ON order_items FOR UPDATE
  USING (order_id IN (SELECT id FROM orders WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Users can delete order items via order"
  ON order_items FOR DELETE
  USING (order_id IN (SELECT id FROM orders WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())));

-- Triggers
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
