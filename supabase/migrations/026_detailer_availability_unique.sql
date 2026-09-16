-- Une ligne par jour de la semaine et par professionnel — jamais deux.
--
-- Rien ne l'empêchait jusqu'ici (aucune migration ne trace la création
-- initiale de `detailer_availability`). Le nouvel écran « Horaires »
-- (docs/19-horaires-ouverture.md) fait un upsert par jour à chaque
-- enregistrement : sans cette contrainte, ré-enregistrer créerait des lignes
-- en double plutôt que de remplacer la précédente.

create unique index if not exists detailer_availability_detailer_weekday_idx
  on detailer_availability (detailer_id, weekday);
