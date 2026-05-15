-- ============================================================
-- TaskMate Escrow Infrastructure
-- Adds a proper escrow layer so funds are held by the platform
-- and only released to the provider when the customer approves.
-- ============================================================

-- ── 1. Job-Scoped Virtual Accounts ──────────────────────────
-- Each job gets its OWN VA linked to the platform (not provider).
-- When a customer pays, money goes to TaskMate's Squad account.

CREATE TABLE IF NOT EXISTS job_escrow_vas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_identifier TEXT UNIQUE NOT NULL,  -- Squad customer_identifier = job_id
  virtual_account_number TEXT UNIQUE NOT NULL,
  account_name TEXT,
  bank_name TEXT DEFAULT 'GTBank',
  squad_response JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_escrow_vas_job_id ON job_escrow_vas(job_id);
CREATE INDEX idx_job_escrow_vas_provider_id ON job_escrow_vas(provider_id);
CREATE INDEX idx_job_escrow_vas_va_number ON job_escrow_vas(virtual_account_number);

-- ── 2. Escrow Ledger ─────────────────────────────────────────
-- Tracks funds held in escrow per job, per provider.
-- entry_type: 'held' (customer paid) | 'released' (funds moved to wallet) | 'refunded'

CREATE TABLE IF NOT EXISTS escrow_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('held', 'released', 'refunded', 'disputed')),
  gross_amount NUMERIC(12,2) NOT NULL,       -- Full amount customer paid
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0, -- Platform fee (10%)
  net_amount NUMERIC(12,2) NOT NULL,         -- gross_amount - commission_amount
  squad_reference TEXT,                       -- Squad transaction reference
  squad_response JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_escrow_ledger_provider_id ON escrow_ledger(provider_id);
CREATE INDEX idx_escrow_ledger_job_id ON escrow_ledger(job_id);
CREATE INDEX idx_escrow_ledger_entry_type ON escrow_ledger(entry_type);

-- ── 3. Add Escrow Columns to Jobs ───────────────────────────
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS escrow_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'none'
    CHECK (escrow_status IN ('none', 'held', 'released', 'disputed', 'refunded'));

-- ── 4. RLS Policies ─────────────────────────────────────────

ALTER TABLE job_escrow_vas ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_ledger ENABLE ROW LEVEL SECURITY;

-- Providers can see escrow VAs for their jobs
CREATE POLICY "Providers view own job escrow VAs" ON job_escrow_vas
  FOR SELECT USING (auth.uid() = provider_id);

-- Customers can see escrow VAs for jobs they own
CREATE POLICY "Customers view their job escrow VAs" ON job_escrow_vas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_escrow_vas.job_id
      AND jobs.customer_id = auth.uid()
    )
  );

-- Service role can insert/update (for edge function webhook processing)
CREATE POLICY "Service role manages job escrow VAs" ON job_escrow_vas
  FOR ALL USING (auth.role() = 'service_role');

-- Providers can see their own escrow ledger entries
CREATE POLICY "Providers view own escrow ledger" ON escrow_ledger
  FOR SELECT USING (auth.uid() = provider_id);

-- Customers can see escrow entries for their jobs
CREATE POLICY "Customers view their escrow ledger" ON escrow_ledger
  FOR SELECT USING (auth.uid() = customer_id);

-- Service role can write escrow ledger (edge functions)
CREATE POLICY "Service role manages escrow ledger" ON escrow_ledger
  FOR ALL USING (auth.role() = 'service_role');
