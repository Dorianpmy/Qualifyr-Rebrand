-- Contraintes d'unicité requises par l'éditeur de prestations.
--
-- L'enregistrement utilise `upsert` : sans contrainte unique sur ces triplets,
-- Postgres n'a aucun moyen de savoir qu'une ligne existe déjà et chaque
-- sauvegarde créerait un doublon. Le tunnel lirait alors deux tarifs pour la
-- même prestation et retiendrait celui que le hasard de l'ordre de tri lui
-- donne — un prix qui change sans raison entre deux visites.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'detailer_prices_unique'
  ) THEN
    ALTER TABLE detailer_prices
      ADD CONSTRAINT detailer_prices_unique UNIQUE (detailer_id, scope, vehicle_size);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'detailer_options_unique'
  ) THEN
    ALTER TABLE detailer_options
      ADD CONSTRAINT detailer_options_unique UNIQUE (detailer_id, option_key);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'detailer_soiling_unique'
  ) THEN
    ALTER TABLE detailer_soiling
      ADD CONSTRAINT detailer_soiling_unique UNIQUE (detailer_id, level);
  END IF;
END $$;
