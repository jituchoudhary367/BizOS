-- 016_pg_cron_jobs.sql
-- pg_cron scheduled jobs for periodic maintenance

-- Ensure extension exists (Supabase managed projects may restrict extension creation)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Flag overdue invoices: set status = 'overdue' for unpaid invoices past due_date
CREATE OR REPLACE FUNCTION public.flag_overdue_invoices()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.invoices
  SET status = 'overdue', updated_at = now()
  WHERE due_date < now()::date AND status IN ('pending','sent');
END;
$$;

-- Check inventory thresholds and insert notifications for low stock
CREATE OR REPLACE FUNCTION public.check_inventory_thresholds()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.notifications (id, business_id, type, payload, created_at)
  SELECT gen_random_uuid(), i.business_id, 'low_stock', jsonb_build_object('product_id', i.product_id, 'quantity', i.quantity), now()
  FROM public.inventory i
  WHERE i.quantity <= COALESCE(i.reorder_threshold, 0);
END;
$$;

-- Calculate risk scores (placeholder, can be extended to call external ML via http)
CREATE OR REPLACE FUNCTION public.calculate_customer_risk_scores()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.customers
  SET risk_score = COALESCE((outstanding_balance::numeric / NULLIF(credit_limit,0)) * 100, 0);
END;
$$;

-- Evaluate workflow triggers (placeholder function)
CREATE OR REPLACE FUNCTION public.evaluate_workflow_triggers()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Implementation depends on workflow_triggers table design; keep as noop for now
  PERFORM 1;
END;
$$;

-- Schedule the cron jobs (times are UTC; adjust to IST as needed)
-- Daily at 00:00 UTC -> flag overdue invoices
SELECT cron.schedule('flag_overdue_invoices', '0 0 * * *', $$SELECT public.flag_overdue_invoices();$$);

-- Every 2 hours -> check inventory thresholds
SELECT cron.schedule('check_inventory_thresholds', '0 */2 * * *', $$SELECT public.check_inventory_thresholds();$$);

-- Nightly at 00:30 UTC -> calculate risk scores
SELECT cron.schedule('calculate_customer_risk_scores', '30 0 * * *', $$SELECT public.calculate_customer_risk_scores();$$);

-- Every 15 minutes -> evaluate workflow triggers
SELECT cron.schedule('evaluate_workflow_triggers', '*/15 * * * *', $$SELECT public.evaluate_workflow_triggers();$$);
