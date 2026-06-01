-- 1. Add B-Tree indexes on job_applications foreign keys for performance
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_provider_id ON job_applications(provider_id);

-- 2. Fix Function Search Paths (Security: Prevent search path injection)
ALTER FUNCTION public.get_nearby_providers(double precision, double precision, text) SET search_path = public;
ALTER FUNCTION public.get_nearby_providers(double precision, double precision, text, double precision) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.get_providers_in_radius(double precision, double precision, integer, text[], numeric, text) SET search_path = public;
ALTER FUNCTION public.update_provider_wallet_balance() SET search_path = public;

-- 3. Fix SECURITY DEFINER functions exposed to public/anon
REVOKE EXECUTE ON FUNCTION public.get_nearby_providers(double precision, double precision, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.get_nearby_providers(double precision, double precision, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_nearby_providers(double precision, double precision, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_nearby_providers(double precision, double precision, text, double precision) FROM public;
REVOKE EXECUTE ON FUNCTION public.get_nearby_providers(double precision, double precision, text, double precision) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_nearby_providers(double precision, double precision, text, double precision) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_provider_wallet_balance() FROM public;
REVOKE EXECUTE ON FUNCTION public.update_provider_wallet_balance() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_provider_wallet_balance() FROM authenticated;
-- update_provider_wallet_balance should only be called by triggers or service role

-- 4. Drop overly permissive RLS policy on notifications
DROP POLICY IF EXISTS "Anyone can create notifications" ON notifications;

-- 5. Drop broad SELECT policies on storage.objects for public buckets
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "chat_media_select" ON storage.objects;

-- Re-enable minimal bucket access if necessary (though public buckets serve files directly via URL without RLS)
-- We will only leave the default INSERT/UPDATE policies if they exist, but remove broad listings.
