-- 000_helpers.sql
-- Helper functions used by RLS policies and triggers

-- Get the business_id for a given user id
CREATE OR REPLACE FUNCTION public.get_user_business_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT business_id FROM public.profiles WHERE id = p_user_id LIMIT 1;
$$;

-- Generic trigger to set updated_at on row modification
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach this trigger to tables that have an `updated_at` column via migrations
