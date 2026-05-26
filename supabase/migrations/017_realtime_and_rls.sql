-- 017_realtime_and_rls.sql
-- Realtime publication adjustments and RLS policy templates

-- Ensure REPLICA IDENTITY FULL for realtime-sensitive tables
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'auth_profiles', 'customers', 'products', 'orders', 'order_items', 'inventory', 'invoices', 'payments', 'ledger_entries', 'ai_conversations', 'agent_logs', 'notifications', 'whatsapp_messages'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL;', tbl);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping %', tbl;
    END;
  END LOOP;
END$$;

-- Add tables to supabase_realtime publication if publication exists
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'auth_profiles', 'customers', 'products', 'orders', 'order_items', 'inventory', 'invoices', 'payments', 'ledger_entries', 'ai_conversations', 'agent_logs', 'notifications', 'whatsapp_messages'
  ];
BEGIN
  FOR tbl IN SELECT unnest(tables) LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add % to publication (maybe already added): %', tbl, SQLERRM;
    END;
  END LOOP;
END$$;

-- Example RLS policy using helper; policies should be tightened per-table
-- Orders: allow members of same business to SELECT/INSERT/UPDATE where business_id matches
CREATE POLICY IF NOT EXISTS policy_orders_business_access ON public.orders
USING (business_id = public.get_user_business_id(current_setting('jwt.claims.sub')::uuid))
WITH CHECK (business_id = public.get_user_business_id(current_setting('jwt.claims.sub')::uuid));

-- Notifications: allow owner access
CREATE POLICY IF NOT EXISTS policy_notifications_owner ON public.notifications
USING (business_id = public.get_user_business_id(current_setting('jwt.claims.sub')::uuid))
WITH CHECK (business_id = public.get_user_business_id(current_setting('jwt.claims.sub')::uuid));

-- AI conversations: restrict writes to authenticated server roles only (example)
CREATE POLICY IF NOT EXISTS policy_ai_conversations_service_role ON public.ai_conversations
FOR ALL
TO authenticated
USING (business_id = public.get_user_business_id(current_setting('jwt.claims.sub')::uuid));

-- Note: Review and adjust policies for each table according to app requirements.
