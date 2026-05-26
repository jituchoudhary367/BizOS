-- ═══════════════════════════════════════════════════════════
-- BizOS Demo Seed Data
-- Business: Sharma Hardware Stores, Ahmedabad
-- ═══════════════════════════════════════════════════════════

-- ─── Business ──────────────────────────────────────────────
INSERT INTO businesses (id, name, type, gstin, address, phone, plan, whatsapp_number)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Sharma Hardware Stores',
  'hardware',
  '24AABCS1429B1ZX',
  '12, Mahatma Gandhi Road, Navrangpura, Ahmedabad, Gujarat - 380009',
  '+919876543210',
  'growth',
  '+919876543210'
);

-- ─── Profile (Owner) ──────────────────────────────────────
-- Note: This references auth.users — in real setup, create the auth user first
-- For seeding, we assume the user ID exists or skip FK check
INSERT INTO profiles (id, business_id, role, full_name, phone, language_preference)
VALUES (
  '660e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'owner',
  'Rajesh Sharma',
  '+919876543210',
  'en'
);

-- ─── Warehouse ─────────────────────────────────────────────
INSERT INTO warehouses (id, business_id, name, address, is_primary)
VALUES (
  '770e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440000',
  'Main Godown',
  '12, MG Road, Navrangpura, Ahmedabad',
  true
);

-- ─── Products (20 realistic hardware items) ───────────────
INSERT INTO products (id, business_id, sku, name, category, unit, buying_price, selling_price, hsn_code, gst_rate, reorder_level) VALUES
  ('aaa00001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'CEM-ULT-50', 'UltraTech Cement 50kg', 'Cement', 'bag', 320.00, 380.00, '2523', 28.00, 50),
  ('aaa00001-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'CEM-ACC-50', 'ACC Cement 50kg', 'Cement', 'bag', 310.00, 370.00, '2523', 28.00, 50),
  ('aaa00001-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'PNT-ASN-20', 'Asian Paints Apex 20L', 'Paint', 'piece', 2800.00, 3400.00, '3209', 18.00, 10),
  ('aaa00001-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440000', 'PNT-ASN-04', 'Asian Paints Tractor 4L', 'Paint', 'piece', 580.00, 720.00, '3209', 18.00, 20),
  ('aaa00001-0000-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440000', 'PNT-BRG-20', 'Berger WeatherCoat 20L', 'Paint', 'piece', 2600.00, 3200.00, '3209', 18.00, 8),
  ('aaa00001-0000-0000-0000-000000000006', '550e8400-e29b-41d4-a716-446655440000', 'PIP-PVC-01', 'PVC Pipe 1 inch (per ft)', 'Pipes & Fittings', 'metre', 35.00, 48.00, '3917', 18.00, 200),
  ('aaa00001-0000-0000-0000-000000000007', '550e8400-e29b-41d4-a716-446655440000', 'PIP-GI-1.5', 'GI Pipe 1.5 inch (per ft)', 'Pipes & Fittings', 'metre', 120.00, 165.00, '7306', 18.00, 100),
  ('aaa00001-0000-0000-0000-000000000008', '550e8400-e29b-41d4-a716-446655440000', 'FIT-ELB-01', 'PVC Elbow 1 inch', 'Pipes & Fittings', 'piece', 8.00, 14.00, '3917', 18.00, 500),
  ('aaa00001-0000-0000-0000-000000000009', '550e8400-e29b-41d4-a716-446655440000', 'STL-TMT-12', 'TMT Steel Bar 12mm (per kg)', 'Steel', 'kg', 55.00, 68.00, '7214', 18.00, 500),
  ('aaa00001-0000-0000-0000-000000000010', '550e8400-e29b-41d4-a716-446655440000', 'SND-RVR-01', 'River Sand (per cubic ft)', 'Sand & Aggregate', 'bag', 40.00, 55.00, '2505', 5.00, 100),
  ('aaa00001-0000-0000-0000-000000000011', '550e8400-e29b-41d4-a716-446655440000', 'SCR-WD-02', 'Wood Screws 2 inch (box/100)', 'Fasteners', 'box', 85.00, 120.00, '7318', 18.00, 50),
  ('aaa00001-0000-0000-0000-000000000012', '550e8400-e29b-41d4-a716-446655440000', 'NL-4IN-01', 'Nails 4 inch (kg)', 'Fasteners', 'kg', 60.00, 82.00, '7317', 18.00, 100),
  ('aaa00001-0000-0000-0000-000000000013', '550e8400-e29b-41d4-a716-446655440000', 'WIR-COP-15', 'Copper Wire 1.5mm (per m)', 'Electrical', 'metre', 25.00, 38.00, '7408', 18.00, 500),
  ('aaa00001-0000-0000-0000-000000000014', '550e8400-e29b-41d4-a716-446655440000', 'SWT-MOD-01', 'Modular Switch 6A', 'Electrical', 'piece', 45.00, 72.00, '8536', 28.00, 200),
  ('aaa00001-0000-0000-0000-000000000015', '550e8400-e29b-41d4-a716-446655440000', 'BRK-RED-01', 'Red Clay Bricks (per 1000)', 'Bricks & Blocks', 'piece', 5500.00, 7200.00, '6901', 5.00, 5),
  ('aaa00001-0000-0000-0000-000000000016', '550e8400-e29b-41d4-a716-446655440000', 'TIL-VIT-02', 'Vitrified Tiles 2x2 ft', 'Tiles', 'box', 380.00, 520.00, '6908', 18.00, 30),
  ('aaa00001-0000-0000-0000-000000000017', '550e8400-e29b-41d4-a716-446655440000', 'PLY-MR-18', 'MR Grade Plywood 18mm', 'Wood & Plywood', 'piece', 1400.00, 1850.00, '4412', 18.00, 15),
  ('aaa00001-0000-0000-0000-000000000018', '550e8400-e29b-41d4-a716-446655440000', 'LCK-GOD-01', 'Godrej Lock 7-Lever', 'Hardware', 'piece', 320.00, 450.00, '8301', 18.00, 25),
  ('aaa00001-0000-0000-0000-000000000019', '550e8400-e29b-41d4-a716-446655440000', 'HNG-SS-04', 'SS Door Hinge 4 inch', 'Hardware', 'piece', 55.00, 85.00, '8302', 18.00, 100),
  ('aaa00001-0000-0000-0000-000000000020', '550e8400-e29b-41d4-a716-446655440000', 'WTP-DR-01', 'Dr. Fixit Waterproofing 20kg', 'Waterproofing', 'piece', 1800.00, 2350.00, '3214', 18.00, 5);

-- ─── Inventory Stock ──────────────────────────────────────
INSERT INTO inventory_stock (business_id, product_id, warehouse_id, quantity, reserved_quantity) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000001', '770e8400-e29b-41d4-a716-446655440010', 120, 20),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000002', '770e8400-e29b-41d4-a716-446655440010', 85, 10),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000003', '770e8400-e29b-41d4-a716-446655440010', 6, 2),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000004', '770e8400-e29b-41d4-a716-446655440010', 18, 3),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000005', '770e8400-e29b-41d4-a716-446655440010', 4, 0),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000006', '770e8400-e29b-41d4-a716-446655440010', 450, 50),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000007', '770e8400-e29b-41d4-a716-446655440010', 80, 0),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000008', '770e8400-e29b-41d4-a716-446655440010', 320, 0),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000009', '770e8400-e29b-41d4-a716-446655440010', 1200, 200),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000010', '770e8400-e29b-41d4-a716-446655440010', 60, 0),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000011', '770e8400-e29b-41d4-a716-446655440010', 35, 5),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000012', '770e8400-e29b-41d4-a716-446655440010', 150, 0),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000013', '770e8400-e29b-41d4-a716-446655440010', 800, 100),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000014', '770e8400-e29b-41d4-a716-446655440010', 180, 0),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000015', '770e8400-e29b-41d4-a716-446655440010', 3, 1),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000016', '770e8400-e29b-41d4-a716-446655440010', 22, 0),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000017', '770e8400-e29b-41d4-a716-446655440010', 12, 2),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000018', '770e8400-e29b-41d4-a716-446655440010', 40, 5),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000019', '770e8400-e29b-41d4-a716-446655440010', 90, 0),
  ('550e8400-e29b-41d4-a716-446655440000', 'aaa00001-0000-0000-0000-000000000020', '770e8400-e29b-41d4-a716-446655440010', 3, 0);

-- ─── Customers (10 realistic Gujarati business names) ─────
INSERT INTO customers (id, business_id, name, phone, whatsapp_number, address, city, state, gstin, credit_limit, outstanding_balance, risk_score, payment_terms_days, tags) VALUES
  ('ccc00001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'Patel Construction Co.', '+919898123456', '+919898123456', '45 CG Road, Navrangpura', 'Ahmedabad', 'Gujarat', '24AABCP9876B1ZQ', 500000.00, 125000.00, 0.35, 30, '{"regular","high-value"}'),
  ('ccc00001-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'Ravi Electronics & Hardware', '+919898234567', '+919898234567', '12 Ashram Road, Ellis Bridge', 'Ahmedabad', 'Gujarat', '24AABCR5678C2ZM', 200000.00, 42000.00, 0.15, 15, '{"regular"}'),
  ('ccc00001-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'Amit Traders', '+919898345678', '+919898345678', '78 Relief Road, Kalupur', 'Ahmedabad', 'Gujarat', '24AABCA3456D3ZL', 300000.00, 210000.00, 0.78, 30, '{"credit-risk","frequent"}'),
  ('ccc00001-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440000', 'Gujarat Builders Pvt Ltd', '+919898456789', '+919898456789', '9 SG Highway, Bodakdev', 'Ahmedabad', 'Gujarat', '24AABCG7890E4ZK', 1000000.00, 380000.00, 0.45, 45, '{"premium","project-based"}'),
  ('ccc00001-0000-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440000', 'Mehta Home Solutions', '+919898567890', '+919898567890', '22 Satellite Road, Jodhpur', 'Ahmedabad', 'Gujarat', '24AABCM2345F5ZJ', 150000.00, 0.00, 0.05, 15, '{"retail","prompt-payer"}'),
  ('ccc00001-0000-0000-0000-000000000006', '550e8400-e29b-41d4-a716-446655440000', 'Desai Infraprojects', '+919898678901', '+919898678901', '5 Prahlad Nagar, Satellite', 'Ahmedabad', 'Gujarat', '24AABCD5678G6ZI', 750000.00, 165000.00, 0.52, 30, '{"project-based"}'),
  ('ccc00001-0000-0000-0000-000000000007', '550e8400-e29b-41d4-a716-446655440000', 'Shah & Sons Hardware', '+919898789012', '+919898789012', '89 Manek Chowk', 'Ahmedabad', 'Gujarat', NULL, 100000.00, 28000.00, 0.20, 15, '{"wholesale","regular"}'),
  ('ccc00001-0000-0000-0000-000000000008', '550e8400-e29b-41d4-a716-446655440000', 'Rajput Plumbing Works', '+919898890123', '+919898890123', '33 Gomtipur', 'Ahmedabad', 'Gujarat', NULL, 80000.00, 55000.00, 0.68, 15, '{"credit-risk"}'),
  ('ccc00001-0000-0000-0000-000000000009', '550e8400-e29b-41d4-a716-446655440000', 'Joshi Civil Engineers', '+919898901234', '+919898901234', '67 Vastrapur', 'Ahmedabad', 'Gujarat', '24AABCJ9012H8ZG', 400000.00, 92000.00, 0.30, 30, '{"regular","project-based"}'),
  ('ccc00001-0000-0000-0000-000000000010', '550e8400-e29b-41d4-a716-446655440000', 'Trivedi Paint & Hardware', '+919898012345', '+919898012345', '15 Paldi', 'Ahmedabad', 'Gujarat', '24AABCT0123I9ZF', 200000.00, 15000.00, 0.10, 15, '{"retail","prompt-payer"}');

-- ─── Suppliers (3) ────────────────────────────────────────
INSERT INTO suppliers (id, business_id, name, phone, whatsapp_number, address, city, state, gstin, lead_time_days) VALUES
  ('sss00001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'UltraTech Cement Depot (Gujarat)', '+919822111222', '+919822111222', 'GIDC Vatva, Ahmedabad', 'Ahmedabad', 'Gujarat', '24AABCU1111A1ZZ', 3),
  ('sss00001-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'Ahmedabad Steel Traders', '+919822333444', '+919822333444', 'GIDC Naroda, Ahmedabad', 'Ahmedabad', 'Gujarat', '24AABCA3333B2ZY', 5),
  ('sss00001-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'Gujarat Paint Distributors', '+919822555666', '+919822555666', 'Changodar Industrial Area', 'Ahmedabad', 'Gujarat', '24AABCG5555C3ZX', 2);

-- ─── Orders (30 days of history — sample 15 orders) ───────
INSERT INTO orders (id, business_id, customer_id, order_number, source, status, total_amount, tax_amount, discount_amount, delivery_date, created_at) VALUES
  ('ooo00001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'ccc00001-0000-0000-0000-000000000001', 'ORD-2026-0001', 'whatsapp', 'delivered', 45600.00, 6912.00, 0.00, '2026-04-25', now() - interval '28 days'),
  ('ooo00001-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'ccc00001-0000-0000-0000-000000000003', 'ORD-2026-0002', 'whatsapp', 'delivered', 22800.00, 3456.00, 500.00, '2026-04-28', now() - interval '25 days'),
  ('ooo00001-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'ccc00001-0000-0000-0000-000000000004', 'ORD-2026-0003', 'manual', 'delivered', 126000.00, 19080.00, 2000.00, '2026-05-01', now() - interval '22 days'),
  ('ooo00001-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440000', 'ccc00001-0000-0000-0000-000000000002', 'ORD-2026-0004', 'whatsapp', 'delivered', 8640.00, 1310.00, 0.00, '2026-05-03', now() - interval '20 days'),
  ('ooo00001-0000-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440000', 'ccc00001-0000-0000-0000-000000000005', 'ORD-2026-0005', 'manual', 'delivered', 15400.00, 2334.00, 200.00, '2026-05-05', now() - interval '18 days'),
  ('ooo00001-0000-0000-0000-000000000006', '550e8400-e29b-41d4-a716-446655440000', 'ccc00001-0000-0000-0000-000000000006', 'ORD-2026-0006', 'whatsapp', 'delivered', 68200.00, 10332.00, 0.00, '2026-05-07', now() - interval '16 days'),
  ('ooo00001-0000-0000-0000-000000000007', '550e8400-e29b-41d4-a716-446655440000', 'ccc00001-0000-0000-0000-000000000007', 'ORD-2026-0007', 'whatsapp', 'delivered', 12300.00, 1864.00, 0.00, '2026-05-09', now() - interval '14 days'),
  ('ooo00001-0000-0000-0000-000000000008', '550e8400-e29b-41d4-a716-446655440000', 'ccc00001-0000-0000-0000-000000000001', 'ORD-2026-0008', 'whatsapp', 'dispatched', 34200.00, 5184.00, 1000.00, '2026-05-15', now() - interval '10 days'),
  ('ooo00001-0000-0000-0000-000000000009', '550e8400-e29b-41d4-a716-446655440000', 'ccc00001-0000-0000-0000-000000000009', 'ORD-2026-0009', 'manual', 'processing', 52800.00, 8004.00, 0.00, '2026-05-18', now() - interval '7 days'),
  ('ooo00001-0000-0000-0000-000000000010', '550e8400-e29b-41d4-a716-446655440000', 'ccc00001-0000-0000-0000-000000000003', 'ORD-2026-0010', 'whatsapp', 'confirmed', 18500.00, 2805.00, 0.00, '2026-05-20', now() - interval '5 days'),
  ('ooo00001-0000-0000-0000-000000000011', '550e8400-e29b-41d4-a716-446655440000', 'ccc00001-0000-0000-0000-000000000008', 'ORD-2026-0011', 'voice', 'confirmed', 7200.00, 1091.00, 0.00, '2026-05-20', now() - interval '4 days'),
  ('ooo00001-0000-0000-0000-000000000012', '550e8400-e29b-41d4-a716-446655440000', 'ccc00001-0000-0000-0000-000000000010', 'ORD-2026-0012', 'whatsapp', 'pending', 9800.00, 1485.00, 0.00, '2026-05-22', now() - interval '2 days'),
  ('ooo00001-0000-0000-0000-000000000013', '550e8400-e29b-41d4-a716-446655440000', 'ccc00001-0000-0000-0000-000000000004', 'ORD-2026-0013', 'whatsapp', 'pending', 95000.00, 14400.00, 5000.00, '2026-05-24', now() - interval '1 day'),
  ('ooo00001-0000-0000-0000-000000000014', '550e8400-e29b-41d4-a716-446655440000', 'ccc00001-0000-0000-0000-000000000006', 'ORD-2026-0014', 'manual', 'pending', 42000.00, 6366.00, 0.00, '2026-05-25', now() - interval '12 hours'),
  ('ooo00001-0000-0000-0000-000000000015', '550e8400-e29b-41d4-a716-446655440000', 'ccc00001-0000-0000-0000-000000000002', 'ORD-2026-0015', 'whatsapp', 'pending', 5400.00, 818.00, 0.00, '2026-05-23', now() - interval '3 hours');

-- ─── Invoices (including 5 overdue) ───────────────────────
INSERT INTO invoices (id, business_id, order_id, customer_id, invoice_number, invoice_date, due_date, status, total_amount, paid_amount, cgst_amount, sgst_amount) VALUES
  ('iii00001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'ooo00001-0000-0000-0000-000000000001', 'ccc00001-0000-0000-0000-000000000001', 'INV-2026-0001', '2026-04-25', '2026-05-10', 'paid', 45600.00, 45600.00, 3456.00, 3456.00),
  ('iii00001-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'ooo00001-0000-0000-0000-000000000002', 'ccc00001-0000-0000-0000-000000000003', 'INV-2026-0002', '2026-04-28', '2026-05-13', 'overdue', 22800.00, 0.00, 1728.00, 1728.00),
  ('iii00001-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'ooo00001-0000-0000-0000-000000000003', 'ccc00001-0000-0000-0000-000000000004', 'INV-2026-0003', '2026-05-01', '2026-05-16', 'overdue', 126000.00, 50000.00, 9540.00, 9540.00),
  ('iii00001-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440000', 'ooo00001-0000-0000-0000-000000000004', 'ccc00001-0000-0000-0000-000000000002', 'INV-2026-0004', '2026-05-03', '2026-05-18', 'overdue', 8640.00, 0.00, 655.00, 655.00),
  ('iii00001-0000-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440000', 'ooo00001-0000-0000-0000-000000000005', 'ccc00001-0000-0000-0000-000000000005', 'INV-2026-0005', '2026-05-05', '2026-05-20', 'paid', 15400.00, 15400.00, 1167.00, 1167.00),
  ('iii00001-0000-0000-0000-000000000006', '550e8400-e29b-41d4-a716-446655440000', 'ooo00001-0000-0000-0000-000000000006', 'ccc00001-0000-0000-0000-000000000006', 'INV-2026-0006', '2026-05-07', '2026-05-22', 'overdue', 68200.00, 20000.00, 5166.00, 5166.00),
  ('iii00001-0000-0000-0000-000000000007', '550e8400-e29b-41d4-a716-446655440000', 'ooo00001-0000-0000-0000-000000000007', 'ccc00001-0000-0000-0000-000000000007', 'INV-2026-0007', '2026-05-09', '2026-05-24', 'sent', 12300.00, 0.00, 932.00, 932.00),
  ('iii00001-0000-0000-0000-000000000008', '550e8400-e29b-41d4-a716-446655440000', 'ooo00001-0000-0000-0000-000000000008', 'ccc00001-0000-0000-0000-000000000001', 'INV-2026-0008', '2026-05-15', '2026-05-30', 'sent', 34200.00, 0.00, 2592.00, 2592.00),
  ('iii00001-0000-0000-0000-000000000009', '550e8400-e29b-41d4-a716-446655440000', 'ooo00001-0000-0000-0000-000000000009', 'ccc00001-0000-0000-0000-000000000009', 'INV-2026-0009', '2026-05-18', '2026-06-02', 'draft', 52800.00, 0.00, 4002.00, 4002.00),
  ('iii00001-0000-0000-0000-000000000010', '550e8400-e29b-41d4-a716-446655440000', NULL, 'ccc00001-0000-0000-0000-000000000008', 'INV-2026-0010', '2026-05-10', '2026-05-17', 'overdue', 28000.00, 0.00, 2124.00, 2124.00);

-- ─── AI Insights (3 active) ──────────────────────────────
INSERT INTO ai_insights (business_id, insight_type, title, body, severity, data) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'inventory', 'Berger WeatherCoat stock critical', 'Only 4 units remaining. Based on current sales velocity (2.3 units/week), stockout expected in 3 days. Recommended reorder: 15 units from Gujarat Paint Distributors.', 'critical', '{"product_id": "aaa00001-0000-0000-0000-000000000005", "current_stock": 4, "daily_velocity": 0.33, "stockout_days": 3, "reorder_qty": 15}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'collections', 'Amit Traders — high credit risk', 'Outstanding balance ₹2,10,000 exceeds 70% of credit limit. Payment delayed on last 2 invoices. Risk score increased to 0.78. Consider tightening credit limit or requiring advance payment.', 'warning', '{"customer_id": "ccc00001-0000-0000-0000-000000000003", "outstanding": 210000, "credit_limit": 300000, "utilization_pct": 70}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'forecast', 'Cement demand surge expected', 'Historical data shows 35% increase in cement orders during monsoon preparation (June–July). Current stock of UltraTech (120 bags) and ACC (85 bags) may not meet projected demand. Consider placing advance PO this week.', 'info', '{"products": ["UltraTech Cement", "ACC Cement"], "expected_increase_pct": 35, "current_stock": 205, "projected_demand": 310}');

-- ─── WhatsApp Messages (5 sample parsed orders) ──────────
INSERT INTO whatsapp_messages (business_id, message_id, from_number, to_number, direction, message_type, body, status, parsed_intent, linked_order_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'wamid.001', '+919898123456', '+919876543210', 'inbound', 'text', 'Bhai 20 cement aur 5 paint bhej dena kal tak', 'parsed', '{"intent": "order", "items": [{"name": "cement", "quantity": 20}, {"name": "paint", "quantity": 5}], "delivery": "tomorrow", "confidence": 0.94}', 'ooo00001-0000-0000-0000-000000000001'),
  ('550e8400-e29b-41d4-a716-446655440000', 'wamid.002', '+919876543210', '+919898123456', 'outbound', 'text', '✅ Order confirmed!\n\nOrder #ORD-2026-0001\n- UltraTech Cement 50kg × 20 = ₹7,600\n- Asian Paints Apex 20L × 5 = ₹17,000\n\nTotal: ₹45,600 (incl. GST)\nDelivery: Tomorrow by 2 PM\n\nInvoice: [link]', 'sent', NULL, 'ooo00001-0000-0000-0000-000000000001'),
  ('550e8400-e29b-41d4-a716-446655440000', 'wamid.003', '+919898345678', '+919876543210', 'inbound', 'text', 'sharma ji, 50 bag cement chahiye ACC wala. Price kya hai aaj?', 'parsed', '{"intent": "order_with_query", "items": [{"name": "ACC cement", "quantity": 50}], "query": "price", "confidence": 0.89}', 'ooo00001-0000-0000-0000-000000000002'),
  ('550e8400-e29b-41d4-a716-446655440000', 'wamid.004', '+919898456789', '+919876543210', 'inbound', 'text', 'Need 200 TMT bars 12mm and 100 bags river sand for the Bodakdev project. Delivery to site directly.', 'parsed', '{"intent": "order", "items": [{"name": "TMT steel bar 12mm", "quantity": 200, "unit": "kg"}, {"name": "river sand", "quantity": 100, "unit": "bag"}], "delivery_note": "deliver to Bodakdev site", "confidence": 0.96}', 'ooo00001-0000-0000-0000-000000000003'),
  ('550e8400-e29b-41d4-a716-446655440000', 'wamid.005', '+919898234567', '+919876543210', 'inbound', 'text', '10 modular switch 6A aur 50 meter copper wire 1.5mm send karo', 'parsed', '{"intent": "order", "items": [{"name": "modular switch 6A", "quantity": 10}, {"name": "copper wire 1.5mm", "quantity": 50, "unit": "metre"}], "confidence": 0.92}', 'ooo00001-0000-0000-0000-000000000004');

-- ─── Agent Logs (sample) ─────────────────────────────────
INSERT INTO agent_logs (business_id, agent_name, action, input, output, duration_ms, llm_model, success) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'order_agent', 'parse_whatsapp_order', '{"message": "Bhai 20 cement aur 5 paint bhej dena kal tak", "from": "+919898123456"}', '{"order_id": "ooo00001-0000-0000-0000-000000000001", "items_parsed": 2, "confidence": 0.94}', 342, 'groq/llama3-70b', true),
  ('550e8400-e29b-41d4-a716-446655440000', 'inventory_agent', 'check_stock_levels', '{"trigger": "daily_scan"}', '{"alerts": [{"product": "Berger WeatherCoat", "stock": 4, "reorder_level": 8, "action": "reorder_recommended"}]}', 156, 'groq/llama3-70b', true),
  ('550e8400-e29b-41d4-a716-446655440000', 'collections_agent', 'send_payment_reminder', '{"customer_id": "ccc00001-0000-0000-0000-000000000003", "outstanding": 210000}', '{"whatsapp_sent": true, "message": "Reminder: ₹2,10,000 outstanding. Kindly arrange payment."}', 1823, 'gemini-1.5-pro', true),
  ('550e8400-e29b-41d4-a716-446655440000', 'analytics_agent', 'generate_daily_summary', '{"date": "2026-05-21"}', '{"revenue": 147200, "orders": 4, "top_product": "UltraTech Cement", "collections_received": 65400}', 2341, 'gemini-1.5-pro', true),
  ('550e8400-e29b-41d4-a716-446655440000', 'finance_agent', 'generate_invoice', '{"order_id": "ooo00001-0000-0000-0000-000000000008"}', '{"invoice_id": "iii00001-0000-0000-0000-000000000008", "invoice_number": "INV-2026-0008", "total": 34200}', 456, 'groq/llama3-70b', true);

-- ─── Staff Members ────────────────────────────────────────
INSERT INTO staff_members (id, business_id, full_name, phone, designation, department, salary, join_date) VALUES
  ('fff00001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'Vikram Singh', '+919876001001', 'Store Manager', 'Operations', 35000.00, '2024-03-15'),
  ('fff00001-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'Raj Patel', '+919876001002', 'Warehouse Incharge', 'Warehouse', 25000.00, '2024-06-01'),
  ('fff00001-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'Sunil Kumar', '+919876001003', 'Delivery Boy', 'Logistics', 18000.00, '2024-09-10'),
  ('fff00001-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440000', 'Priya Sharma', '+919876001004', 'Accountant', 'Finance', 28000.00, '2025-01-05');

-- ─── Notifications (sample) ──────────────────────────────
INSERT INTO notifications (business_id, profile_id, title, body, type, action_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'New order from WhatsApp', 'Patel Construction ordered 20 bags cement + 5 paint cans', 'alert', '/app/orders/ooo00001-0000-0000-0000-000000000001'),
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'Low stock alert', 'Berger WeatherCoat 20L is below reorder level (4 remaining)', 'alert', '/app/inventory/aaa00001-0000-0000-0000-000000000005'),
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'Payment received', 'Mehta Home Solutions paid ₹15,400 via UPI', 'info', '/app/finance/invoices'),
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'AI Insight: Seasonal demand', 'Cement demand expected to surge 35% in June-July. Stock up now.', 'ai_insight', '/app/inventory');
