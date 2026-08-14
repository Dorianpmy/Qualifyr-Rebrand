-- Galerie avant / après — axe différenciant vs agenda pur

CREATE TABLE IF NOT EXISTS detailer_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detailer_id uuid NOT NULL REFERENCES detailers(id) ON DELETE CASCADE,
  title text NOT NULL,
  vehicle_label text,
  service_label text,
  before_url text NOT NULL,
  after_url text NOT NULL,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS detailer_cases_detailer_idx
  ON detailer_cases(detailer_id, published, sort_order);

ALTER TABLE detailer_cases ENABLE ROW LEVEL SECURITY;
