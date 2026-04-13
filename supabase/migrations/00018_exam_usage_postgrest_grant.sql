-- supabase/migrations/00018_exam_usage_postgrest_grant.sql
--
-- Grant SELECT to authenticated so PostgREST includes exam_usage in its
-- schema cache (required for service_role access via REST API).
-- No RLS policy is added for authenticated, so regular users see zero rows.

GRANT SELECT ON public.exam_usage TO authenticated;
