-- Robust RLS policies for negotiations
-- This ensures both customers and providers can participate in threads correctly

-- 1. Enable RLS
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;

-- 2. SELECT Policy: Allow involved parties to see messages
DROP POLICY IF EXISTS "negotiations_select" ON negotiations;
CREATE POLICY "negotiations_select" ON negotiations
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid()
    OR provider_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = negotiations.job_id
        AND (jobs.customer_id = auth.uid() OR jobs.worker_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. INSERT Policy: Allow involved parties to send messages
DROP POLICY IF EXISTS "negotiations_insert" ON negotiations;
CREATE POLICY "negotiations_insert" ON negotiations
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Customer can insert if they own the job
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_id
        AND jobs.customer_id = auth.uid()
    )
    -- Provider can insert if they are the target provider OR they applied to the job
    OR provider_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM job_applications
      WHERE job_id = negotiations.job_id
        AND provider_id = auth.uid()
    )
    -- Admin can do anything
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Ensure provider_id is handled correctly for existing records
-- If a message was sent by a provider, ensure provider_id is set to their ID
UPDATE negotiations 
SET provider_id = sender_id 
WHERE provider_id IS NULL 
AND EXISTS (SELECT 1 FROM profiles WHERE id = negotiations.sender_id AND role = 'provider');
