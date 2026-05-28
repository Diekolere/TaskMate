-- ============================================================
-- TaskMate — Complete Supabase PostgreSQL Schema
-- Paste this ENTIRE file into the Supabase SQL Editor and run.
-- ============================================================

-- ── 0. Extensions ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. Enums ───────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('customer', 'provider', 'admin');

CREATE TYPE job_status AS ENUM (
  'open',
  'pending',
  'interested',
  'negotiating',
  'provider_accepted',
  'awaiting_payment',
  'payment_secured',
  'in_progress',
  'completed',
  'payment_released',
  'cancelled',
  'disputed'
);

CREATE TYPE verification_status AS ENUM (
  'unverified',
  'pending',
  'under_review',
  'verified',
  'rejected'
);

CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high');

CREATE TYPE request_type AS ENUM ('public', 'private');

CREATE TYPE notification_type AS ENUM (
  'job_update',
  'payment',
  'negotiation',
  'review',
  'system',
  'verification',
  'progress_update'
);

CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- ── 2. Core Tables ─────────────────────────────────────────

-- 2a. profiles — unified user table (linked to auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  role        user_role NOT NULL DEFAULT 'customer',
  avatar_url  TEXT,
  phone_number TEXT,
  location_name TEXT,
  trust_score  NUMERIC(5,2) DEFAULT 50.0,
  is_active   BOOLEAN DEFAULT TRUE,
  status      TEXT DEFAULT 'Active', -- 'Active' | 'Suspended'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2b. provider_profiles — provider-specific data
CREATE TABLE provider_profiles (
  id                    UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  business_name         TEXT,
  bio                   TEXT,
  trade_category        TEXT[] DEFAULT '{}',
  years_experience      INTEGER DEFAULT 0,
  hourly_rate_min       NUMERIC(10,2),
  hourly_rate_max       NUMERIC(10,2),
  min_service_fee       NUMERIC(10,2),
  emergency_fee         NUMERIC(10,2),
  is_negotiable         BOOLEAN DEFAULT FALSE,
  service_radius_km     INTEGER DEFAULT 10,
  average_rating        NUMERIC(3,2) DEFAULT 0.0,
  completed_jobs_count  INTEGER DEFAULT 0,
  total_earnings        NUMERIC(12,2) DEFAULT 0.0,
  verification_status   verification_status DEFAULT 'unverified',
  website               TEXT,
  address               TEXT,
  coordinates           JSONB, -- { lat, lng }
  availability          JSONB, -- { monday: { active, start, end }, ... }
  bank_name             TEXT,
  account_number        TEXT,
  account_name          TEXT,
  kyc_completed         BOOLEAN DEFAULT FALSE,
  bvn_verified          BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 2c. customer_profiles — customer-specific data
CREATE TABLE customer_profiles (
  id             UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  saved_workers  UUID[] DEFAULT '{}',
  total_spent    NUMERIC(12,2) DEFAULT 0.0,
  jobs_posted    INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Jobs ────────────────────────────────────────────────

CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  worker_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT DEFAULT 'General',
  status          job_status DEFAULT 'open',
  request_type    request_type DEFAULT 'public',
  visibility      request_type DEFAULT 'public',
  budget_estimate NUMERIC(12,2),
  final_budget    NUMERIC(12,2),
  agreed_price    NUMERIC(12,2),
  urgency         urgency_level DEFAULT 'medium',
  location_name   TEXT,
  coordinates     JSONB,
  images          TEXT[] DEFAULT '{}',
  timeline        JSONB DEFAULT '[]', -- array of progress events
  scheduled_date  DATE,
  otp_code        TEXT, -- 4-digit code for job start verification
  otp_expires_at  TIMESTAMPTZ,
  customer_name   TEXT,
  customer_phone  TEXT,
  customer_photo  TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_worker_id ON jobs(worker_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- ── 4. Job Applications (provider interest/bids) ──────────

CREATE TABLE job_applications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  provider_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proposed_price  NUMERIC(12,2),
  message         TEXT,
  status          TEXT DEFAULT 'pending', -- pending, accepted, rejected
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, provider_id)
);

CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_provider_id ON job_applications(provider_id);

-- ── 5. Negotiations (chat messages) ───────────────────────

CREATE TABLE negotiations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, price_proposal, system, finalize_request
  price       NUMERIC(12,2), -- for price proposals
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_negotiations_job_id ON negotiations(job_id);
CREATE INDEX idx_negotiations_created_at ON negotiations(created_at);

-- ── 6. Reviews ─────────────────────────────────────────────

CREATE TABLE reviews (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id       UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  reviewer_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating       NUMERIC(3,2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment      TEXT,
  tags         TEXT[] DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, reviewer_id)
);

CREATE INDEX idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ── 7. Notifications ──────────────────────────────────────

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        notification_type DEFAULT 'system',
  title       TEXT NOT NULL,
  body        TEXT,
  icon        TEXT DEFAULT 'info',
  icon_bg     TEXT DEFAULT 'bg-gray-100',
  icon_color  TEXT DEFAULT 'text-gray-400',
  is_read     BOOLEAN DEFAULT FALSE,
  cta_path    TEXT, -- optional link to navigate to
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ── 8. Service Posts (provider portfolio) ─────────────────

CREATE TABLE service_posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caption     TEXT,
  images      TEXT[] DEFAULT '{}',
  tags        TEXT[] DEFAULT '{}',
  category    TEXT,
  location    TEXT,
  likes_count INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_posts_provider_id ON service_posts(provider_id);
CREATE INDEX idx_service_posts_created_at ON service_posts(created_at DESC);

-- ── 9. Verifications (KYC) ────────────────────────────────

CREATE TABLE verifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_name   TEXT,
  email           TEXT,
  id_front_url    TEXT,
  id_back_url     TEXT,
  business_license_url TEXT,
  selfie_url      TEXT,
  status          verification_status DEFAULT 'pending',
  admin_notes     TEXT,
  reviewed_by     UUID REFERENCES profiles(id),
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verifications_provider_id ON verifications(provider_id);
CREATE INDEX idx_verifications_status ON verifications(status);

-- ── 10. Earnings ──────────────────────────────────────────

CREATE TABLE earnings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id        UUID REFERENCES jobs(id) ON DELETE SET NULL,
  gross_amount  NUMERIC(12,2) NOT NULL,
  commission    NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount    NUMERIC(12,2) NOT NULL,
  status        TEXT DEFAULT 'pending', -- pending, released, withdrawn
  payout_ref    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_earnings_provider_id ON earnings(provider_id);
CREATE INDEX idx_earnings_status ON earnings(status);

-- ── 11. Support Tickets ───────────────────────────────────

CREATE TABLE support_tickets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  category    TEXT DEFAULT 'general',
  status      ticket_status DEFAULT 'open',
  priority    TEXT DEFAULT 'normal',
  admin_reply TEXT,
  replied_by  UUID REFERENCES profiles(id),
  replied_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- ── 12. Platform Settings ─────────────────────────────────

CREATE TABLE platform_settings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commission_rate  NUMERIC(5,4) DEFAULT 0.06, -- 6%
  auto_release_hours INTEGER DEFAULT 48,
  updated_by       UUID REFERENCES profiles(id),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO platform_settings (commission_rate, auto_release_hours)
VALUES (0.06, 48);

-- ── 13. Triggers ──────────────────────────────────────────

-- Auto-update `updated_at` on any table that has it
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_provider_profiles
  BEFORE UPDATE ON provider_profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_customer_profiles
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_jobs
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_job_applications
  BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_service_posts
  BEFORE UPDATE ON service_posts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_verifications
  BEFORE UPDATE ON verifications
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_support_tickets
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_role public.user_role;
BEGIN
  -- Safely extract the role from metadata, do NOT default to anything if missing
  BEGIN
    extracted_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    extracted_role := NULL;
  END;

  -- If no valid role metadata exists, do NOT create the profile row.
  -- The frontend will detect the missing profile and force the user to select one.
  IF extracted_role IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    extracted_role,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  
  -- Create role-specific profile
  IF extracted_role = 'provider' THEN
    INSERT INTO public.provider_profiles (id) VALUES (NEW.id);
  ELSE
    INSERT INTO public.customer_profiles (id) VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update provider stats when review is added
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE provider_profiles
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE provider_id = NEW.provider_id
    ),
    updated_at = NOW()
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- Create earning record when payment is released
CREATE OR REPLACE FUNCTION handle_payment_release()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_rate NUMERIC(5,4);
  v_gross NUMERIC(12,2);
  v_commission NUMERIC(12,2);
BEGIN
  -- Only trigger when status changes to payment_released
  IF NEW.status = 'payment_released' AND OLD.status != 'payment_released' AND NEW.worker_id IS NOT NULL THEN
    SELECT commission_rate INTO v_commission_rate FROM platform_settings LIMIT 1;
    v_gross := COALESCE(NEW.agreed_price, NEW.final_budget, NEW.budget_estimate, 0);
    v_commission := ROUND(v_gross * COALESCE(v_commission_rate, 0.06), 2);
    
    INSERT INTO earnings (provider_id, job_id, gross_amount, commission, net_amount, status)
    VALUES (NEW.worker_id, NEW.id, v_gross, v_commission, v_gross - v_commission, 'released');
    
    -- Update provider stats
    UPDATE provider_profiles
    SET 
      completed_jobs_count = completed_jobs_count + 1,
      total_earnings = total_earnings + (v_gross - v_commission)
    WHERE id = NEW.worker_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_payment_released
  AFTER UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION handle_payment_release();

-- ── 14. Row Level Security ────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- ── profiles ──
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ── provider_profiles ──
CREATE POLICY "provider_profiles_select_all" ON provider_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "provider_profiles_update_own" ON provider_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "provider_profiles_insert_own" ON provider_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ── customer_profiles ──
CREATE POLICY "customer_profiles_select_own" ON customer_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "customer_profiles_update_own" ON customer_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "customer_profiles_insert_own" ON customer_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ── jobs ──
-- Customers see their own jobs
CREATE POLICY "jobs_select_customer" ON jobs
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid()
    OR worker_id = auth.uid()
    OR (status = 'open' AND request_type = 'public')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "jobs_insert_customer" ON jobs
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "jobs_update_participant" ON jobs
  FOR UPDATE TO authenticated
  USING (
    customer_id = auth.uid()
    OR worker_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "jobs_delete_customer" ON jobs
  FOR DELETE TO authenticated
  USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── job_applications ──
CREATE POLICY "job_applications_select" ON job_applications
  FOR SELECT TO authenticated
  USING (
    provider_id = auth.uid()
    OR EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.customer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "job_applications_insert" ON job_applications
  FOR INSERT TO authenticated
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "job_applications_update" ON job_applications
  FOR UPDATE TO authenticated
  USING (
    provider_id = auth.uid()
    OR EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.customer_id = auth.uid())
  );

-- ── negotiations ──
CREATE POLICY "negotiations_select" ON negotiations
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_id
        AND (jobs.customer_id = auth.uid() OR jobs.worker_id = auth.uid())
    )
  );

CREATE POLICY "negotiations_insert" ON negotiations
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- ── reviews ──
CREATE POLICY "reviews_select_all" ON reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "reviews_insert_reviewer" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- ── notifications ──
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- ── service_posts ──
CREATE POLICY "service_posts_select_all" ON service_posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_posts_insert_own" ON service_posts
  FOR INSERT TO authenticated
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "service_posts_update_own" ON service_posts
  FOR UPDATE TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "service_posts_delete_own" ON service_posts
  FOR DELETE TO authenticated
  USING (provider_id = auth.uid());

-- ── verifications ──
CREATE POLICY "verifications_select" ON verifications
  FOR SELECT TO authenticated
  USING (
    provider_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "verifications_insert_own" ON verifications
  FOR INSERT TO authenticated
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "verifications_update_admin" ON verifications
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── earnings ──
CREATE POLICY "earnings_select_own" ON earnings
  FOR SELECT TO authenticated
  USING (
    provider_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── support_tickets ──
CREATE POLICY "support_tickets_select" ON support_tickets
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "support_tickets_insert_own" ON support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "support_tickets_update" ON support_tickets
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── platform_settings ──
CREATE POLICY "platform_settings_select" ON platform_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "platform_settings_update_admin" ON platform_settings
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 15. Storage Buckets ───────────────────────────────────

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('job-images', 'job-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('service-posts', 'service-posts', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('chat_media', 'chat_media', true);

-- Storage policies
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "job_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'job-images');
CREATE POLICY "job_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'job-images' AND auth.role() = 'authenticated');

CREATE POLICY "service_posts_storage_select" ON storage.objects FOR SELECT USING (bucket_id = 'service-posts');
CREATE POLICY "service_posts_storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'service-posts' AND auth.role() = 'authenticated');
CREATE POLICY "service_posts_storage_delete" ON storage.objects FOR DELETE USING (bucket_id = 'service-posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "verification_docs_select" ON storage.objects FOR SELECT USING (bucket_id = 'verification-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')));
CREATE POLICY "verification_docs_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'verification-docs' AND auth.role() = 'authenticated');

CREATE POLICY "invoices_select" ON storage.objects FOR SELECT USING (bucket_id = 'invoices' AND (auth.uid()::text = (storage.foldername(name))[1] OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')));
CREATE POLICY "invoices_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'invoices' AND auth.role() = 'authenticated');

CREATE POLICY "chat_media_select" ON storage.objects FOR SELECT USING (bucket_id = 'chat_media');
CREATE POLICY "chat_media_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat_media' AND auth.role() = 'authenticated');
CREATE POLICY "chat_media_update" ON storage.objects FOR UPDATE USING (bucket_id = 'chat_media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "chat_media_delete" ON storage.objects FOR DELETE USING (bucket_id = 'chat_media' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ── 16. Realtime ──────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE negotiations;
ALTER PUBLICATION supabase_realtime ADD TABLE job_applications;
