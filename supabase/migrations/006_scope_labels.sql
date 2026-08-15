-- Nom commercial des formules, choisi par le professionnel.
--
-- « Intérieur », « Extérieur », « Complet » décrivent un périmètre technique,
-- pas une offre. Les professionnels vendent des « Formule Éclat », des
-- « Remise à neuf », des « Pack Restitution LOA » — et un client qui a vu
-- « Formule Éclat » sur Instagram doit retrouver ce nom-là au moment de
-- réserver, sinon il croit s'être trompé de page.
--
-- Le périmètre technique (`scope`) reste inchangé : c'est lui qui pilote le
-- calcul du devis. Seul l'habillage est libre. Renommer une formule ne doit
-- jamais modifier un prix ni une durée.

CREATE TABLE IF NOT EXISTS detailer_scope_labels (
  detailer_id uuid NOT NULL REFERENCES detailers(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('interieur', 'exterieur', 'complet')),
  label text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (detailer_id, scope)
);

ALTER TABLE detailer_scope_labels ENABLE ROW LEVEL SECURITY;

-- Lisible publiquement pour les fiches en ligne : la page de réservation doit
-- afficher ces noms sans session.
DROP POLICY IF EXISTS detailer_scope_labels_public_select ON detailer_scope_labels;
CREATE POLICY detailer_scope_labels_public_select ON detailer_scope_labels
  FOR SELECT
  USING (
    detailer_id IN (
      SELECT id FROM detailers WHERE published = true OR owner_id = auth.uid()
    )
  );
