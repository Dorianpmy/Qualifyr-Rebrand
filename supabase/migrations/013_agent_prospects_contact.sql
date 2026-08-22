-- ---------------------------------------------------------------------------
-- Premier contact automatique — colonnes manquantes sur agent_prospects.
--
-- Le scan Sirene (migration 010) ne trouve ni e-mail ni numéro de téléphone :
-- ce sont des registres d'entreprises, pas des annuaires de contact. Cette
-- migration ajoute ce qu'il faut pour un enrichissement en deux temps
-- (Google Places pour le tél/site, extraction sur le site pour l'e-mail) puis
-- un envoi automatique, traçable et réversible.
-- ---------------------------------------------------------------------------

alter table public.agent_prospects
  add column if not exists email text,
  -- Horodatage de la tentative d'enrichissement (Places + extraction e-mail),
  -- qu'elle ait trouvé quelque chose ou non. Sans lui, chaque passage du cron
  -- réinterrogerait indéfiniment les prospects déjà tentés en vain — Places
  -- est facturé à l'appel.
  add column if not exists enriched_at timestamptz,
  -- Jeton unique par prospect, glissé dans le lien de désinscription de l'e-
  -- mail de premier contact. Un jeton non devinable évite qu'un tiers
  -- désinscrive un prospect qui n'est pas le sien en changeant un paramètre
  -- dans l'URL.
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists agent_prospects_unsubscribe_token_idx
  on public.agent_prospects (unsubscribe_token);

-- La file d'enrichissement : prospects jamais tentés, en attente d'un
-- passage du cron /api/agent/enrich.
create index if not exists agent_prospects_unenriched_idx
  on public.agent_prospects (created_at)
  where enriched_at is null;

-- La file de contact : prospects enrichis avec un e-mail exploitable, jamais
-- contactés, pas opposés.
create index if not exists agent_prospects_contactable_idx
  on public.agent_prospects (created_at)
  where email is not null and contacted_at is null and opted_out_at is null;
