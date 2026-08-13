-- Facturation B2B FR (socle e-facture 2026/2027)
-- Mentions légales + numérotation continue. Transmission PA/PDP = phase 2.

ALTER TABLE detailers
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS siret text,
  ADD COLUMN IF NOT EXISTS siren text,
  ADD COLUMN IF NOT EXISTS tva_intra text,
  ADD COLUMN IF NOT EXISTS legal_address text,
  ADD COLUMN IF NOT EXISTS legal_city text,
  ADD COLUMN IF NOT EXISTS legal_postal text,
  ADD COLUMN IF NOT EXISTS legal_country text DEFAULT 'FR',
  ADD COLUMN IF NOT EXISTS rcs text,
  ADD COLUMN IF NOT EXISTS capital text,
  ADD COLUMN IF NOT EXISTS invoice_prefix text DEFAULT 'FA',
  ADD COLUMN IF NOT EXISTS invoice_next_number integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS default_tva_rate numeric(5,2) DEFAULT 20.00,
  ADD COLUMN IF NOT EXISTS tva_franchise boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detailer_id uuid NOT NULL REFERENCES detailers(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  number text NOT NULL,
  sequence integer NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'issued', 'sent', 'paid', 'cancelled')),
  issued_at timestamptz,
  service_date date,
  -- Client (acheteur)
  client_name text NOT NULL,
  client_email text,
  client_siren text,
  client_siret text,
  client_tva_intra text,
  client_address text,
  client_city text,
  client_postal text,
  client_country text DEFAULT 'FR',
  -- Catégorie opération (e-facture 2026)
  operation_category text NOT NULL DEFAULT 'service'
    CHECK (operation_category IN ('goods', 'service', 'mixed')),
  -- Montants
  currency text NOT NULL DEFAULT 'EUR',
  amount_ht numeric(12,2) NOT NULL DEFAULT 0,
  tva_rate numeric(5,2) NOT NULL DEFAULT 20,
  amount_tva numeric(12,2) NOT NULL DEFAULT 0,
  amount_ttc numeric(12,2) NOT NULL DEFAULT 0,
  tva_franchise boolean NOT NULL DEFAULT false,
  notes text,
  payment_terms text DEFAULT 'Paiement à réception',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (detailer_id, number)
);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 1,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price_ht numeric(12,2) NOT NULL DEFAULT 0,
  tva_rate numeric(5,2) NOT NULL DEFAULT 20,
  amount_ht numeric(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS invoices_detailer_idx ON invoices(detailer_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS invoice_lines_invoice_idx ON invoice_lines(invoice_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;

-- Lecture/écriture via service_role côté app (dashboard). Policies owner optionnelles plus tard.
