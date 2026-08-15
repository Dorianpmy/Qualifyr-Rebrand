-- Marché suisse : chaque fiche déclare son pays.
--
-- Le défaut 'FR' est délibéré : les fiches existantes doivent continuer à
-- afficher des euros et une TVA à 20 %. La contrainte interdit toute autre
-- valeur — un pays mal orthographié produirait silencieusement une facture
-- française pour un professionnel suisse.

ALTER TABLE detailers
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'FR';

ALTER TABLE detailers
  DROP CONSTRAINT IF EXISTS detailers_country_check;

ALTER TABLE detailers
  ADD CONSTRAINT detailers_country_check CHECK (country IN ('FR', 'CH'));

-- Arguments de réassurance affichés sur la page publique.
--
-- Stockés par fiche plutôt qu'écrits en dur : un professionnel qui ne se
-- déplace pas ne doit pas promettre une intervention à domicile, et un
-- professionnel sans assurance ne doit pas l'afficher.

ALTER TABLE detailers
  ADD COLUMN IF NOT EXISTS free_cancellation_hours integer NOT NULL DEFAULT 24;

ALTER TABLE detailers
  ADD COLUMN IF NOT EXISTS insurance_label text;

ALTER TABLE detailers
  ADD COLUMN IF NOT EXISTS years_experience integer;

ALTER TABLE detailers
  ADD COLUMN IF NOT EXISTS intro text;
