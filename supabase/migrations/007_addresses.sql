-- Adresse exacte d'intervention.
--
-- Jusqu'ici, le client saisissait un code postal et **estimait lui-même** la
-- distance jusqu'au professionnel, alors que c'est cette distance qui
-- détermine les frais de déplacement. Autant demander au client de fixer une
-- partie de son propre prix : sous-estimée, le professionnel roule à perte ;
-- surestimée, la réservation est perdue pour un montant qui n'existe pas.
--
-- L'adresse géocodée remplace la devinette. La distance devient calculée, et
-- le professionnel sait où se garer.

ALTER TABLE detailer_bookings
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS access_note text;

-- Point de départ du professionnel : sans lui, aucune distance n'est
-- calculable. Séparé de `workshop_address`, qui est une adresse d'accueil
-- affichée aux clients et pas nécessairement le point de départ des tournées.
ALTER TABLE detailers
  ADD COLUMN IF NOT EXISTS base_address text,
  ADD COLUMN IF NOT EXISTS base_latitude double precision,
  ADD COLUMN IF NOT EXISTS base_longitude double precision;
