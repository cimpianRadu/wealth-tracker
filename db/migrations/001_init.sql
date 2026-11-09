-- Schema de pornire pentru wealthtracker.ro v2: gospodării (cupluri), membri,
-- invitații, extrase și tranzacții. Neon Postgres, regiune UE.
-- Accesul se verifică în aplicație: fiecare interogare filtrează pe household_id
-- după ce s-a confirmat că utilizatorul e membru (src/lib/household.ts).

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  google_sub text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);

CREATE TABLE login_codes (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX login_codes_email_idx ON login_codes (email, created_at DESC);

CREATE TABLE households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  base_currency text NOT NULL DEFAULT 'RON',
  usd_rate numeric(10,4) NOT NULL DEFAULT 4.80,
  eur_rate numeric(10,4) NOT NULL DEFAULT 5.10,
  gbp_rate numeric(10,4) NOT NULL DEFAULT 6.00,
  statement_due_day int NOT NULL DEFAULT 5 CHECK (statement_due_day BETWEEN 1 AND 28),
  partner_transfers text NOT NULL DEFAULT 'expense' CHECK (partner_transfers IN ('expense', 'internal')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE household_members (
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  display_name text NOT NULL,
  monthly_budget numeric(12,2),
  budget_currency text NOT NULL DEFAULT 'RON',
  aliases text[] NOT NULL DEFAULT '{}',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, user_id)
);
CREATE INDEX household_members_user_idx ON household_members (user_id);

CREATE TABLE invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  accepted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label text NOT NULL,
  currency text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, owner_id, label, currency)
);

CREATE TABLE statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period text NOT NULL,
  file_name text NOT NULL,
  bank text,
  tx_count int NOT NULL DEFAULT 0,
  skipped_duplicates int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX statements_household_idx ON statements (household_id, period);

CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  statement_id uuid REFERENCES statements(id) ON DELETE CASCADE,
  tx_date date NOT NULL,
  description text NOT NULL,
  merchant text NOT NULL,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL,
  amount_base numeric(14,2) NOT NULL,
  direction text NOT NULL CHECK (direction IN ('out', 'in')),
  kind text NOT NULL CHECK (kind IN ('expense', 'income', 'own_transfer', 'fx', 'investment', 'refund')),
  category text NOT NULL,
  pending boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transactions_household_date_idx ON transactions (household_id, tx_date);
CREATE INDEX transactions_member_idx ON transactions (household_id, member_id, tx_date);

-- Plafon simplu pe apelurile AI, ca un cont să nu poată arde bugetul de API.
CREATE TABLE ai_calls (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_calls_user_idx ON ai_calls (user_id, kind, created_at DESC);

-- Reminderele pentru extrase, trimise o singură dată pe membru, lună și fel.
CREATE TABLE reminder_log (
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period text NOT NULL,
  kind text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, user_id, period, kind)
);
