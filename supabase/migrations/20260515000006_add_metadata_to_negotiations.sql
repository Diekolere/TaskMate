-- Add metadata and price columns to negotiations if they don't exist
-- This supports rich chat features like price proposals and finalization requests

ALTER TABLE negotiations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS price NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';

-- Create index for performance on message_type if needed
CREATE INDEX IF NOT EXISTS idx_negotiations_message_type ON negotiations(message_type);
