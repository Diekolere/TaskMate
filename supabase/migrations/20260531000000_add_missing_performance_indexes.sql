-- Add missing foreign key indexes for performance
-- Discovered during performance audit

CREATE INDEX IF NOT EXISTS idx_negotiations_sender_id ON negotiations(sender_id);
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_earnings_job_id ON earnings(job_id);
CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_by ON platform_settings(updated_by);
