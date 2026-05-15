-- Add actionable fields to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS cta_label TEXT,
ADD COLUMN IF NOT EXISTS secondary_label TEXT DEFAULT 'Later';

-- Add comment for documentation
COMMENT ON COLUMN public.notifications.cta_label IS 'The text for the primary action button in a toast notification';
COMMENT ON COLUMN public.notifications.secondary_label IS 'The text for the secondary/dismiss action button in a toast notification';
