-- 018_storage.sql
-- Storage bucket creation and RLS templates

-- NOTE: Supabase storage buckets are commonly created via the REST API or dashboard.
-- Some hosted Supabase projects provide SQL functions to create buckets. If available, you can run the following.

-- Create public-read assets bucket
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE proname = 'bucket_create') THEN
    PERFORM bucket_create('bizos-assets', true);
  ELSE
    RAISE NOTICE 'No bucket_create function found; create `bizos-assets` via Supabase dashboard or REST API.';
  END IF;
END$$;

-- Create authenticated invoices bucket
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE proname = 'bucket_create') THEN
    PERFORM bucket_create('bizos-invoices', false);
  ELSE
    RAISE NOTICE 'No bucket_create function found; create `bizos-invoices` via Supabase dashboard or REST API.';
  END IF;
END$$;

-- Storage RLS policy templates (adjust according to exact storage extension functions)
-- Allow business members to read assets bucket objects
-- CREATE POLICY policy_storage_assets ON storage.objects
-- USING ( (metadata->>'business_id')::uuid = public.get_user_business_id(current_setting('jwt.claims.sub')::uuid) );
