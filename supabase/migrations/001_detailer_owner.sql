-- Lien compte Auth ↔ fiche detailer + accès RLS pour le dashboard

ALTER TABLE detailers
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS detailers_owner_id_idx ON detailers(owner_id);

-- Lecture / écriture des réservations pour le propriétaire de la fiche
ALTER TABLE detailer_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS detailer_bookings_owner_select ON detailer_bookings;
CREATE POLICY detailer_bookings_owner_select ON detailer_bookings
  FOR SELECT
  USING (
    detailer_id IN (
      SELECT id FROM detailers WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS detailer_bookings_owner_update ON detailer_bookings;
CREATE POLICY detailer_bookings_owner_update ON detailer_bookings
  FOR UPDATE
  USING (
    detailer_id IN (
      SELECT id FROM detailers WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    detailer_id IN (
      SELECT id FROM detailers WHERE owner_id = auth.uid()
    )
  );

-- Lecture de sa propre fiche
ALTER TABLE detailers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS detailers_owner_select ON detailers;
CREATE POLICY detailers_owner_select ON detailers
  FOR SELECT
  USING (owner_id = auth.uid() OR published = true);
