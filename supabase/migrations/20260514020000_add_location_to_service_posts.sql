-- Add location column to service_posts table
ALTER TABLE service_posts ADD COLUMN IF NOT EXISTS location TEXT;

-- Refresh schema cache reminder: Supabase usually does this automatically, 
-- but if using PostgREST directly, a notify pgrst 'reload schema' might be needed.
-- In most cases, just adding the column is enough for the client to see it after a few seconds.
