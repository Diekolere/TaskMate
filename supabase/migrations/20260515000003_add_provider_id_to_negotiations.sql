-- Add provider_id to negotiations table to support multi-provider threads
ALTER TABLE negotiations ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_negotiations_provider_id ON negotiations(provider_id);

-- Update existing negotiations: if sender is a provider, set provider_id to sender_id
-- This is a best-effort migration for existing data
UPDATE negotiations 
SET provider_id = sender_id 
WHERE provider_id IS NULL 
AND EXISTS (SELECT 1 FROM profiles WHERE id = negotiations.sender_id AND role = 'provider');

-- For customer messages, we'd need to know which provider they were talking to. 
-- Since we can't easily know this for old data, they might stay null or we can try to guess.
-- But for new data, we will set it explicitly.
