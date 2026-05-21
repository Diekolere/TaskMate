-- Add RLS Policy to allow customers to invite providers
CREATE POLICY "Customers can invite providers to their jobs" 
ON public.job_applications 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE id = job_id 
    AND customer_id = auth.uid()
  )
  AND status = 'invited'
);

-- Note: Depending on existing policies, an UPDATE policy might also be needed 
-- if the upsert is conflicting on an existing record.
CREATE POLICY "Customers can update their own job invites" 
ON public.job_applications 
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE id = job_id 
    AND customer_id = auth.uid()
  )
);
