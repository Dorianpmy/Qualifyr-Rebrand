-- Plafond volontaire du nombre de créneaux proposés par jour.
--
-- Le moteur de créneaux (`availability.ts`) calcule des débuts possibles en
-- avançant par pas de `slot_granularity_minutes` à partir de l'ouverture,
-- tant que la durée demandée tient avant la fermeture. Un professionnel qui
-- ne veut que deux interventions par jour (ex. Auto Clean Pro : 16h30 et
-- 17h45, tous les jours sauf dimanche) ne peut pas l'exprimer avec une seule
-- amplitude d'ouverture — un client qui choisit une prestation plus courte
-- verrait un créneau supplémentaire apparaître, la durée déterminant seule le
-- nombre de créneaux qui tiennent (17/09/2026).
--
-- `null` (valeur par défaut) : aucun plafond, comportement historique
-- inchangé pour tous les professionnels existants.
alter table detailers
  add column if not exists max_daily_slots integer null
    check (max_daily_slots is null or max_daily_slots >= 0);
