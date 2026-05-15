-- ============================================================
-- TaskMate Payment Infrastructure — Squad Static Virtual Accounts
-- Enables platform wallet model with static per-provider VAs
-- ============================================================

-- ── 1. Virtual Accounts Table ──────────────────────────────
-- Stores one permanent static VA per provider (created once on acceptance)

CREATE TABLE IF NOT EXISTS virtual_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_identifier TEXT UNIQUE NOT NULL, -- Squad customer_identifier (same as provider_id)
  virtual_account_number TEXT UNIQUE NOT NULL, -- The actual VA number from Squad
  account_name TEXT, -- Display name on VA (e.g., "TASKMATE / JOHN DOE")
  beneficiary_account TEXT NOT NULL, -- TaskMate GTBank account (all money settles here)
  beneficiary_bank_name TEXT DEFAULT 'GTBank', -- Bank name for reference
  squad_response JSONB, -- Full Squad API response for audit
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_virtual_accounts_provider_id ON virtual_accounts(provider_id);
CREATE INDEX idx_virtual_accounts_customer_identifier ON virtual_accounts(customer_identifier);
CREATE INDEX idx_virtual_accounts_virtual_account_number ON virtual_accounts(virtual_account_number);

-- ── 2. Transactions Table ──────────────────────────────────
-- Records all Squad webhook transactions (idempotency via reference key)

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL, -- Squad transaction_reference (idempotency key)
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  virtual_account_number TEXT NOT NULL REFERENCES virtual_accounts(virtual_account_number),
  principal_amount NUMERIC(12,2) NOT NULL, -- Amount customer paid
  settled_amount NUMERIC(12,2) NOT NULL, -- Amount after Squad fees
  currency TEXT DEFAULT 'NGN',
  channel TEXT DEFAULT 'virtual-account',
  squad_response JSONB NOT NULL, -- Full webhook payload for audit
  status TEXT DEFAULT 'completed', -- completed, failed
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_provider_id ON transactions(provider_id);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ── 3. Wallet Ledger Table ─────────────────────────────────
-- Tracks all wallet balance changes (credits, withdrawals, commissions)

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL, -- 'credit', 'debit', 'commission_debit', 'withdrawal'
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  metadata JSONB, -- Additional context (job_id, reason, etc)
  balance_after NUMERIC(12,2) NOT NULL, -- Running balance after this entry
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_ledger_provider_id ON wallet_ledger(provider_id);
CREATE INDEX idx_wallet_ledger_created_at ON wallet_ledger(created_at DESC);

-- ── 4. Webhook Logs Table ──────────────────────────────────
-- Audit trail of all Squad webhooks received

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'charge.completed', 'charge.failed', etc
  payload JSONB NOT NULL, -- Full webhook payload
  headers JSONB, -- Webhook headers including x-squad-signature
  signature_valid BOOLEAN DEFAULT FALSE,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_logs_received_at ON webhook_logs(received_at DESC);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);

-- ── 5. Add Provider Profile Fields ──────────────────────────
-- Add wallet_balance to provider_profiles if not exists

ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS virtual_account_id UUID REFERENCES virtual_accounts(id);

-- ── 6. Functions & Triggers ─────────────────────────────────

-- Update provider's wallet balance based on ledger
CREATE OR REPLACE FUNCTION update_provider_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE provider_profiles
  SET wallet_balance = NEW.balance_after
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_wallet_on_ledger
AFTER INSERT ON wallet_ledger
FOR EACH ROW
EXECUTE FUNCTION update_provider_wallet_balance();

-- Auto-update updated_at on virtual_accounts
CREATE TRIGGER set_updated_at_virtual_accounts
BEFORE UPDATE ON virtual_accounts
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

-- ── 7. Configuration ───────────────────────────────────────
-- Store TaskMate beneficiary account details

CREATE TABLE IF NOT EXISTS payment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TODO: Replace '4920299492' with actual TaskMate GTBank account for production
INSERT INTO payment_config (config_key, config_value)
VALUES 
  ('taskmate_beneficiary_account', '4920299492'),
  ('taskmate_beneficiary_bank', 'GTBank')
ON CONFLICT (config_key) DO NOTHING;

-- ── 8. RLS Policies ────────────────────────────────────────

-- Enable RLS
ALTER TABLE virtual_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;

-- Providers can view their own VAs
CREATE POLICY "Providers can view own VAs" ON virtual_accounts
FOR SELECT USING (auth.uid() = provider_id);

-- Customers can view VAs for jobs they created (using EXISTS for Supabase compatibility)
CREATE POLICY "Customers can view VAs for their jobs" ON virtual_accounts
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.worker_id = virtual_accounts.provider_id 
    AND jobs.customer_id = auth.uid()
  )
);

-- Providers can view their own transactions
CREATE POLICY "Providers can view own transactions" ON transactions
FOR SELECT USING (auth.uid() = provider_id);

-- Providers can view their own ledger
CREATE POLICY "Providers can view own ledger" ON wallet_ledger
FOR SELECT USING (auth.uid() = provider_id);

-- Service role can insert (for webhook processing)
CREATE POLICY "Service role processes transactions" ON transactions
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role inserts ledger" ON wallet_ledger
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role logs webhooks" ON webhook_logs
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Public can read payment config (needed for SDK)
CREATE POLICY "Public reads payment config" ON payment_config
FOR SELECT USING (true);
