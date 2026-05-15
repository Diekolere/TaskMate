-- Update RLS for negotiations to allow providers who are negotiating (but not yet assigned) to see messages
DROP POLICY IF EXISTS "negotiations_select" ON negotiations;
CREATE POLICY "negotiations_select" ON negotiations
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid()
    OR provider_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_id
        AND (jobs.customer_id = auth.uid() OR jobs.worker_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
