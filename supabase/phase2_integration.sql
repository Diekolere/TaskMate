-- ============================================================
-- Phase 2 Integration Schema Updates
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── 1. Enable PostGIS ───────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── 2. Add Location Geography Columns ───────────────────────
-- We use GEOGRAPHY(POINT) for precise distance calculations in meters

-- For Jobs (Customer Requests)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location_coords GEOGRAPHY(POINT, 4326);

-- For Providers (Artisans)
ALTER TABLE provider_profiles 
  ADD COLUMN IF NOT EXISTS location_coords GEOGRAPHY(POINT, 4326),
  ADD COLUMN IF NOT EXISTS service_radius_meters INTEGER DEFAULT 15000, -- 15km default
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- For Customers (and all users)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS location_coords GEOGRAPHY(POINT, 4326),
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- Index for fast proximity searches
CREATE INDEX IF NOT EXISTS idx_jobs_location_coords ON jobs USING GIST (location_coords);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_location_coords ON provider_profiles USING GIST (location_coords);

-- ── 3. Create Job Messages Table (Negotiation) ──────────────

CREATE TABLE IF NOT EXISTS job_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message         TEXT NOT NULL,
  type            TEXT DEFAULT 'text', -- text, budget_proposal, agreement
  metadata        JSONB DEFAULT '{}', -- e.g. { budget: 5000 }
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_job_messages_job_id ON job_messages(job_id);

-- ── 4. Helper Functions (PostGIS) ──────────────────────────

-- RPC for finding providers nearby a job
CREATE OR REPLACE FUNCTION get_nearby_providers(
  job_lat DOUBLE PRECISION,
  job_lng DOUBLE PRECISION,
  category_name TEXT
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  bio TEXT,
  trade_category TEXT[],
  average_rating NUMERIC,
  completed_jobs_count INTEGER,
  distance_meters FLOAT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id,
    pp.business_name,
    pp.bio,
    pp.trade_category,
    pp.average_rating,
    pp.completed_jobs_count,
    ST_Distance(
      pp.location_coords,
      ST_SetSRID(ST_MakePoint(job_lng, job_lat), 4326)::geography
    ) as distance_meters
  FROM provider_profiles pp
  WHERE 
    pp.verification_status = 'verified'
    AND category_name = ANY(pp.trade_category)
    AND ST_DWithin(
      pp.location_coords,
      ST_SetSRID(ST_MakePoint(job_lng, job_lat), 4326)::geography,
      pp.service_radius_meters
    )
  ORDER BY distance_meters ASC
  LIMIT 20;
END;
$$;

-- Enable RLS
ALTER TABLE job_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_messages_select" ON job_messages
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM jobs 
      WHERE id = job_id 
      AND (customer_id = auth.uid() OR worker_id = auth.uid())
    )
  );

CREATE POLICY "job_messages_insert" ON job_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM jobs 
      WHERE id = job_id 
      AND (customer_id = auth.uid() OR worker_id = auth.uid())
    )
  );

-- ── 5. Add to Realtime ─────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'job_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE job_messages;
    END IF;
END $$;
