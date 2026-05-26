-- combined_migration.sql
-- This file aggregates important migrations for manual paste into Supabase SQL editor.

-- 000_helpers
\i 000_helpers.sql

-- 001-014 (existing migrations) -- ensure you have these files applied in order
-- If you need them combined, append their contents here or run them from the existing files.

-- 015_db_functions
\i 015_db_functions.sql

-- 016_pg_cron_jobs
\i 016_pg_cron_jobs.sql

-- 017_realtime_and_rls
\i 017_realtime_and_rls.sql

-- 018_storage
\i 018_storage.sql

-- End of combined migration. Paste this entire file into the Supabase SQL editor
-- and run it. Note: Some commands (extension creation, pg_cron scheduling, bucket creation)
-- may require elevated project privileges or must be created via the dashboard/REST API.
-- ═══════════════════════════════════════════════════════════════════
-- BizOS — COMPLETE DATABASE MIGRATION
-- Run this ONCE in Supabase SQL Editor (https://supabase.com/dashboard)
-- Project: wjdyyiuanbptcubetrdu
-- ═══════════════════════════════════════════════════════════════════

-- ─── 000: Helper Functions ─────────────────────────────────────────

-- Helper: get current user's business_id (used in all RLS policies)
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS UUID AS $$
  SELECT business_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Trigger function: auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ═══════════════════════════════════════════════════════════════════
-- 001: Businesses & Auth Profiles
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE business_type AS ENUM (
  'wholesale', 'pharmacy', 'restaurant', 'hardware',
  'garment', 'electronics', 'fmcg', 'other'
);
CREATE TYPE plan_type AS ENUM ('starter', 'growth', 'enterprise');
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'staff');

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
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE INDEX idx_profiles_business_id ON profiles(business_id);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business"
  ON businesses FOR SELECT
  USING (id = public.get_user_business_id());

CREATE POLICY "Owners can update own business"
  ON businesses FOR UPDATE
  USING (id = public.get_user_business_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

CREATE POLICY "Anyone can insert business on signup"
  ON businesses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view business profiles"
  ON profiles FOR SELECT
  USING (business_id = public.get_user_business_id());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Anyone can insert profile on signup"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- 002: Products
-- ═══════════════════════════════════════════════════════════════════

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
  ON products FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert products for own business"
  ON products FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can update own business products"
  ON products FOR UPDATE USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can delete own business products"
  ON products FOR DELETE USING (business_id = public.get_user_business_id());

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- 003: Customers & Suppliers
-- ═══════════════════════════════════════════════════════════════════

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

CREATE INDEX idx_customers_business_id ON customers(business_id);
CREATE INDEX idx_customers_phone ON customers(business_id, phone);
CREATE INDEX idx_customers_whatsapp ON customers(business_id, whatsapp_number);
CREATE INDEX idx_suppliers_business_id ON suppliers(business_id);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business customers" ON customers FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert customers" ON customers FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can update own business customers" ON customers FOR UPDATE USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can delete own business customers" ON customers FOR DELETE USING (business_id = public.get_user_business_id());

CREATE POLICY "Users can view own business suppliers" ON suppliers FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert suppliers" ON suppliers FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can update own business suppliers" ON suppliers FOR UPDATE USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can delete own business suppliers" ON suppliers FOR DELETE USING (business_id = public.get_user_business_id());

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- 004: Orders & Order Items
-- ═══════════════════════════════════════════════════════════════════

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

CREATE UNIQUE INDEX idx_orders_number ON orders(business_id, order_number);
CREATE INDEX idx_orders_business_id ON orders(business_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(business_id, status);
CREATE INDEX idx_orders_created_at ON orders(business_id, created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business orders" ON orders FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert orders" ON orders FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can update own business orders" ON orders FOR UPDATE USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can delete own business orders" ON orders FOR DELETE USING (business_id = public.get_user_business_id());

CREATE POLICY "Users can view order items" ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE business_id = public.get_user_business_id()));
CREATE POLICY "Users can insert order items" ON order_items FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE business_id = public.get_user_business_id()));
CREATE POLICY "Users can update order items" ON order_items FOR UPDATE
  USING (order_id IN (SELECT id FROM orders WHERE business_id = public.get_user_business_id()));
CREATE POLICY "Users can delete order items" ON order_items FOR DELETE
  USING (order_id IN (SELECT id FROM orders WHERE business_id = public.get_user_business_id()));

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- 005: Inventory (Warehouses + Stock)
-- ═══════════════════════════════════════════════════════════════════

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

CREATE INDEX idx_warehouses_business_id ON warehouses(business_id);
CREATE INDEX idx_inventory_stock_business_id ON inventory_stock(business_id);
CREATE INDEX idx_inventory_stock_product_id ON inventory_stock(product_id);
CREATE INDEX idx_inventory_stock_warehouse_id ON inventory_stock(warehouse_id);
CREATE UNIQUE INDEX idx_inventory_stock_unique ON inventory_stock(product_id, warehouse_id) WHERE batch_number IS NULL;

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business warehouses" ON warehouses FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert warehouses" ON warehouses FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can update own business warehouses" ON warehouses FOR UPDATE USING (business_id = public.get_user_business_id());

CREATE POLICY "Users can view own business stock" ON inventory_stock FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert stock" ON inventory_stock FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can update own business stock" ON inventory_stock FOR UPDATE USING (business_id = public.get_user_business_id());

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_stock_updated_at BEFORE UPDATE ON inventory_stock FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- 006: Invoices
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  cgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  sgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  igst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  pdf_url TEXT,
  payment_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_invoices_number ON invoices(business_id, invoice_number);
CREATE INDEX idx_invoices_business_id ON invoices(business_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(business_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(business_id, due_date);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business invoices" ON invoices FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert invoices" ON invoices FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can update own business invoices" ON invoices FOR UPDATE USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can delete own business invoices" ON invoices FOR DELETE USING (business_id = public.get_user_business_id());

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- 007: Ledger & Payments
-- ═══════════════════════════════════════════════════════════════════

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

CREATE INDEX idx_payments_business_id ON payments(business_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_ledger_business_id ON ledger_entries(business_id);
CREATE INDEX idx_ledger_entity ON ledger_entries(business_id, entity_type, entity_id);
CREATE INDEX idx_ledger_created_at ON ledger_entries(business_id, created_at DESC);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business payments" ON payments FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert payments" ON payments FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can update own business payments" ON payments FOR UPDATE USING (business_id = public.get_user_business_id());

CREATE POLICY "Users can view own business ledger" ON ledger_entries FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert ledger entries" ON ledger_entries FOR INSERT WITH CHECK (business_id = public.get_user_business_id());

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- 008: Staff Members & Attendance
-- ═══════════════════════════════════════════════════════════════════

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

CREATE INDEX idx_staff_business_id ON staff_members(business_id);
CREATE INDEX idx_attendance_business_id ON attendance(business_id);
CREATE INDEX idx_attendance_staff_date ON attendance(staff_id, date);
CREATE UNIQUE INDEX idx_attendance_unique ON attendance(staff_id, date);

ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business staff" ON staff_members FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert staff" ON staff_members FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can update own business staff" ON staff_members FOR UPDATE USING (business_id = public.get_user_business_id());

CREATE POLICY "Users can view own business attendance" ON attendance FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert attendance" ON attendance FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can update own business attendance" ON attendance FOR UPDATE USING (business_id = public.get_user_business_id());

CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- 009: Tasks & Purchase Orders
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'overdue');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE po_status AS ENUM ('draft', 'sent', 'received', 'partial', 'cancelled');

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

CREATE INDEX idx_tasks_business_id ON tasks(business_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(business_id, status);
CREATE UNIQUE INDEX idx_po_number ON purchase_orders(business_id, po_number);
CREATE INDEX idx_po_business_id ON purchase_orders(business_id);
CREATE INDEX idx_po_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_po_items_po_id ON purchase_order_items(purchase_order_id);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business tasks" ON tasks FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert tasks" ON tasks FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can update own business tasks" ON tasks FOR UPDATE USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can delete own business tasks" ON tasks FOR DELETE USING (business_id = public.get_user_business_id());

CREATE POLICY "Users can view own business POs" ON purchase_orders FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert POs" ON purchase_orders FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can update own business POs" ON purchase_orders FOR UPDATE USING (business_id = public.get_user_business_id());

CREATE POLICY "Users can view PO items" ON purchase_order_items FOR SELECT
  USING (purchase_order_id IN (SELECT id FROM purchase_orders WHERE business_id = public.get_user_business_id()));
CREATE POLICY "Users can insert PO items" ON purchase_order_items FOR INSERT
  WITH CHECK (purchase_order_id IN (SELECT id FROM purchase_orders WHERE business_id = public.get_user_business_id()));

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- 010: WhatsApp Messages
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_type AS ENUM ('text', 'voice', 'image', 'document', 'template');

CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  message_id TEXT,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  direction message_direction NOT NULL DEFAULT 'inbound',
  message_type message_type NOT NULL DEFAULT 'text',
  body TEXT,
  media_url TEXT,
  status TEXT DEFAULT 'received',
  parsed_intent JSONB,
  linked_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_business_id ON whatsapp_messages(business_id);
CREATE INDEX idx_whatsapp_message_id ON whatsapp_messages(message_id);
CREATE INDEX idx_whatsapp_from_number ON whatsapp_messages(business_id, from_number);
CREATE INDEX idx_whatsapp_created_at ON whatsapp_messages(business_id, created_at DESC);

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business messages" ON whatsapp_messages FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert messages" ON whatsapp_messages FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can update own business messages" ON whatsapp_messages FOR UPDATE USING (business_id = public.get_user_business_id());

CREATE TRIGGER update_whatsapp_messages_updated_at BEFORE UPDATE ON whatsapp_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- 011: AI Conversations
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE conversation_status AS ENUM ('active', 'resolved');

CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New conversation',
  messages JSONB[] DEFAULT '{}',
  context JSONB DEFAULT '{}',
  last_agent TEXT,
  status conversation_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_conversations_business_id ON ai_conversations(business_id);
CREATE INDEX idx_ai_conversations_profile_id ON ai_conversations(profile_id);
CREATE INDEX idx_ai_conversations_session_id ON ai_conversations(session_id);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Owner/manager can view all; staff can view own
CREATE POLICY "Users can view own conversations" ON ai_conversations FOR SELECT
  USING (profile_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = ai_conversations.business_id AND role IN ('owner', 'manager')
  ));
CREATE POLICY "Users can insert own conversations" ON ai_conversations FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Users can update own conversations" ON ai_conversations FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Users can delete own conversations" ON ai_conversations FOR DELETE USING (profile_id = auth.uid());

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- 012: Agent Logs
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  duration_ms INT NOT NULL DEFAULT 0,
  llm_model TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error TEXT,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_logs_business_id ON agent_logs(business_id);
CREATE INDEX idx_agent_logs_agent_name ON agent_logs(business_id, agent_name);
CREATE INDEX idx_agent_logs_created_at ON agent_logs(business_id, created_at DESC);
CREATE INDEX idx_agent_logs_conversation_id ON agent_logs(conversation_id);

ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- Owner/manager only
CREATE POLICY "Owners can view agent logs" ON agent_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = agent_logs.business_id AND role IN ('owner', 'manager')));
CREATE POLICY "Service can insert agent logs" ON agent_logs FOR INSERT
  WITH CHECK (business_id = public.get_user_business_id());


-- ═══════════════════════════════════════════════════════════════════
-- 013: Workflow Triggers
-- ═══════════════════════════════════════════════════════════════════

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

CREATE INDEX idx_workflow_triggers_business_id ON workflow_triggers(business_id);
CREATE INDEX idx_workflow_triggers_event_type ON workflow_triggers(business_id, event_type);

ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;

-- Owner/manager only
CREATE POLICY "Owners can view triggers" ON workflow_triggers FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = workflow_triggers.business_id AND role IN ('owner', 'manager')));
CREATE POLICY "Owners can insert triggers" ON workflow_triggers FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = workflow_triggers.business_id AND role IN ('owner', 'manager')));
CREATE POLICY "Owners can update triggers" ON workflow_triggers FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = workflow_triggers.business_id AND role IN ('owner', 'manager')));
CREATE POLICY "Owners can delete triggers" ON workflow_triggers FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_id = workflow_triggers.business_id AND role IN ('owner', 'manager')));

CREATE TRIGGER update_workflow_triggers_updated_at BEFORE UPDATE ON workflow_triggers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- 014: Notifications & AI Insights
-- ═══════════════════════════════════════════════════════════════════

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

CREATE INDEX idx_notifications_business_id ON notifications(business_id);
CREATE INDEX idx_notifications_profile_id ON notifications(profile_id);
CREATE INDEX idx_notifications_unread ON notifications(profile_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(business_id, created_at DESC);
CREATE INDEX idx_ai_insights_business_id ON ai_insights(business_id);
CREATE INDEX idx_ai_insights_type ON ai_insights(business_id, insight_type);
CREATE INDEX idx_ai_insights_active ON ai_insights(business_id, is_dismissed) WHERE is_dismissed = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Service can insert notifications" ON notifications FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (profile_id = auth.uid());

-- Owner/manager only for insights
CREATE POLICY "Users can view own business insights" ON ai_insights FOR SELECT
  USING (business_id = public.get_user_business_id());
CREATE POLICY "Service can insert insights" ON ai_insights FOR INSERT
  WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can update own business insights" ON ai_insights FOR UPDATE
  USING (business_id = public.get_user_business_id());

CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON ai_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- 015: Audit & Error Tables
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  quantity_delta DECIMAL(12,3) NOT NULL,
  reason TEXT,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE collection_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_ids UUID[] DEFAULT '{}',
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_adj_business ON stock_adjustments(business_id);
CREATE INDEX idx_collection_reminders_customer ON collection_reminders(customer_id, sent_at DESC);
CREATE INDEX idx_error_logs_created ON error_logs(created_at DESC);

ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business adjustments" ON stock_adjustments FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert adjustments" ON stock_adjustments FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
CREATE POLICY "Users can view own business reminders" ON collection_reminders FOR SELECT USING (business_id = public.get_user_business_id());
CREATE POLICY "Users can insert reminders" ON collection_reminders FOR INSERT WITH CHECK (business_id = public.get_user_business_id());


-- ═══════════════════════════════════════════════════════════════════
-- 016: Business Logic Triggers & Functions
-- ═══════════════════════════════════════════════════════════════════

-- Function: create ledger entry on invoice creation (debit)
CREATE OR REPLACE FUNCTION public.create_ledger_on_invoice()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    INSERT INTO ledger_entries (business_id, entity_type, entity_id, entry_type, amount, balance_after, description, reference_id, reference_type)
    VALUES (
      NEW.business_id, 'customer', NEW.customer_id, 'debit', NEW.total_amount,
      COALESCE((SELECT outstanding_balance FROM customers WHERE id = NEW.customer_id), 0) + NEW.total_amount,
      'Invoice ' || NEW.invoice_number,
      NEW.id, 'invoice'
    );
    -- Update customer outstanding
    UPDATE customers SET outstanding_balance = outstanding_balance + NEW.total_amount WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_ledger_on_invoice
  AFTER INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION create_ledger_on_invoice();

-- Function: create ledger entry on payment (credit) and update invoice
CREATE OR REPLACE FUNCTION public.create_ledger_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_invoice_number TEXT;
BEGIN
  -- Get customer from invoice or directly
  v_customer_id := COALESCE(NEW.customer_id,
    (SELECT customer_id FROM invoices WHERE id = NEW.invoice_id));

  v_invoice_number := COALESCE(
    (SELECT invoice_number FROM invoices WHERE id = NEW.invoice_id), 'Direct Payment');

  IF v_customer_id IS NOT NULL THEN
    INSERT INTO ledger_entries (business_id, entity_type, entity_id, entry_type, amount, balance_after, description, reference_id, reference_type)
    VALUES (
      NEW.business_id, 'customer', v_customer_id, 'credit', NEW.amount,
      GREATEST(0, COALESCE((SELECT outstanding_balance FROM customers WHERE id = v_customer_id), 0) - NEW.amount),
      'Payment for ' || v_invoice_number,
      NEW.id, 'payment'
    );
    -- Update customer outstanding
    UPDATE customers SET outstanding_balance = GREATEST(0, outstanding_balance - NEW.amount) WHERE id = v_customer_id;
  END IF;

  -- Update invoice paid_amount and status
  IF NEW.invoice_id IS NOT NULL THEN
    UPDATE invoices
    SET paid_amount = paid_amount + NEW.amount,
        status = CASE
          WHEN paid_amount + NEW.amount >= total_amount THEN 'paid'::invoice_status
          ELSE status
        END
    WHERE id = NEW.invoice_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_ledger_on_payment
  AFTER INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION create_ledger_on_payment();

-- Function: RPC for stock decrement (called by order service)
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_business_id UUID,
  p_product_id UUID,
  p_quantity DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE inventory_stock
  SET quantity = quantity - p_quantity,
      reserved_quantity = reserved_quantity + p_quantity
  WHERE business_id = p_business_id AND product_id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: release stock on order cancel
CREATE OR REPLACE FUNCTION public.release_inventory_on_order_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    UPDATE inventory_stock SET
      quantity = quantity + oi.quantity,
      reserved_quantity = GREATEST(0, reserved_quantity - oi.quantity)
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND inventory_stock.product_id = oi.product_id
      AND inventory_stock.business_id = NEW.business_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_release_inventory_on_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled')
  EXECUTE FUNCTION release_inventory_on_order_cancel();

-- Function: flag overdue invoices (to be called by pg_cron or manually)
CREATE OR REPLACE FUNCTION public.flag_overdue_invoices()
RETURNS INTEGER AS $$
DECLARE
  affected INT;
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE due_date < CURRENT_DATE
    AND status NOT IN ('paid', 'cancelled', 'overdue');
  GET DIAGNOSTICS affected = ROW_COUNT;

  -- Insert notifications for business owners
  INSERT INTO notifications (business_id, profile_id, title, body, type)
  SELECT DISTINCT i.business_id, p.id,
    'Overdue invoices detected',
    'You have invoices past their due date. Review and follow up.',
    'alert'
  FROM invoices i
  JOIN profiles p ON p.business_id = i.business_id AND p.role = 'owner'
  WHERE i.status = 'overdue' AND i.due_date = CURRENT_DATE - INTERVAL '1 day';

  RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: calculate customer risk scores
CREATE OR REPLACE FUNCTION public.calculate_customer_risk_scores()
RETURNS VOID AS $$
BEGIN
  UPDATE customers c SET risk_score = LEAST(1.0,
    COALESCE((
      SELECT
        (COUNT(*) FILTER (WHERE i.status = 'overdue')::DECIMAL / NULLIF(COUNT(*)::DECIMAL, 0)) * 0.4 +
        (COALESCE(AVG(GREATEST(0, EXTRACT(DAY FROM NOW() - i.due_date))) FILTER (WHERE i.status = 'overdue'), 0) / 30.0) * 0.3 +
        (c.outstanding_balance / NULLIF(c.credit_limit, 0)) * 0.3
      FROM invoices i WHERE i.customer_id = c.id
    ), 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════════
-- 017: Realtime Publication & Replica Identity
-- ═══════════════════════════════════════════════════════════════════

-- Enable REPLICA IDENTITY FULL for realtime tables (so UPDATE events include old values)
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE order_items REPLICA IDENTITY FULL;
ALTER TABLE inventory_stock REPLICA IDENTITY FULL;
ALTER TABLE invoices REPLICA IDENTITY FULL;
ALTER TABLE payments REPLICA IDENTITY FULL;
ALTER TABLE ledger_entries REPLICA IDENTITY FULL;
ALTER TABLE whatsapp_messages REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE ai_insights REPLICA IDENTITY FULL;
ALTER TABLE agent_logs REPLICA IDENTITY FULL;
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE attendance REPLICA IDENTITY FULL;
ALTER TABLE ai_conversations REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_stock;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE ledger_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_insights;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_conversations;


-- ═══════════════════════════════════════════════════════════════════
-- 018: Storage Buckets
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public) VALUES ('bizos-assets', 'bizos-assets', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('bizos-invoices', 'bizos-invoices', false);

-- bizos-assets: public read, authenticated write
CREATE POLICY "Public read bizos-assets" ON storage.objects FOR SELECT
  USING (bucket_id = 'bizos-assets');
CREATE POLICY "Authenticated write bizos-assets" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bizos-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated update bizos-assets" ON storage.objects FOR UPDATE
  USING (bucket_id = 'bizos-assets' AND auth.role() = 'authenticated');

-- bizos-invoices: authenticated read only (via signed URLs from backend)
CREATE POLICY "Authenticated read bizos-invoices" ON storage.objects FOR SELECT
  USING (bucket_id = 'bizos-invoices' AND auth.role() = 'authenticated');
CREATE POLICY "Service write bizos-invoices" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bizos-invoices' AND auth.role() = 'authenticated');


-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE — Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════
