/*
# Create subscriptions table (single-tenant, no auth)

## Summary
Creates the `subscriptions` table to store subscription records for the
subscription management app. This is a single-tenant app (no sign-in), so
the data is intentionally shared and accessible via the anon key.

## 1. New Tables

### `subscriptions`
- `id` (uuid, primary key) — unique identifier for each subscription.
- `name` (text, not null) — the subscription name (e.g. "Netflix", "Spotify").
- `price` (numeric(10,2), not null) — the recurring price of the subscription.
- `currency` (text, not null, default 'USD') — ISO currency code.
- `billing_cycle` (text, not null, default 'monthly') — billing frequency:
  one of 'monthly', 'yearly', 'weekly'.
- `renewal_date` (date, not null) — the next renewal date for the subscription.
- `category` (text, default 'Other') — optional category label.
- `notes` (text, default null) — optional free-form notes.
- `active` (boolean, not null, default true) — whether the subscription is active.
- `created_at` (timestamptz, default now()) — when the record was created.
- `updated_at` (timestamptz, default now()) — when the record was last updated.

## 2. Security
- Enable Row Level Security on `subscriptions`.
- Because this is a single-tenant app (no auth flow), allow anon + authenticated
  full CRUD so the anon-key frontend can read and write the shared data.

## 3. Indexes
- Index on `renewal_date` for efficient upcoming-renewals queries.
- Index on `active` to quickly filter active subscriptions.
*/

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  renewal_date date NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_subscriptions" ON subscriptions;
CREATE POLICY "anon_select_subscriptions" ON subscriptions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_subscriptions" ON subscriptions;
CREATE POLICY "anon_insert_subscriptions" ON subscriptions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_subscriptions" ON subscriptions;
CREATE POLICY "anon_update_subscriptions" ON subscriptions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_subscriptions" ON subscriptions;
CREATE POLICY "anon_delete_subscriptions" ON subscriptions FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_date
  ON subscriptions (renewal_date);

CREATE INDEX IF NOT EXISTS idx_subscriptions_active
  ON subscriptions (active);
