-- ---------------------------------------------------------------------------
-- agent_prospects — enrichissement e-mail/téléphone par rapprochement
-- OpenStreetMap.
--
-- **Pourquoi.** `agent_prospects.email` n'a jamais été renseigné : Sirene
-- (migration 010) recense des établissements, pas des annuaires de contact,
-- et `nextCandidates` (lib/agent/outreach.ts) exige `email is not null`.
-- Hermès n'avait donc littéralement personne à qui écrire. Cette migration
-- prépare le rapprochement avec OpenStreetMap qui comble ce manque (voir
-- lib/agent/osm-enrich.ts).
--
-- **`email_source` distingue deux origines, parce que le pied de page du
-- message doit dire la bonne** (article 14 du RGPD — collecte indirecte).
-- Une adresse portée directement par le tag `email` d'OpenStreetMap n'a
-- jamais été vue sur le site du prospect par Qualifyr ; dire « publiée sur
-- votre site » serait alors faux, même si un contributeur OSM l'y a peut-être
-- recopiée à l'origine. Voir composeMessage (lib/agent/outreach-message.ts).
--
-- **`enrichment_attempts` plafonne les tentatives, en nombre de passages et
-- non en âge écoulé.** Contrairement au renvoi de rapport (report-retry.ts,
-- retenté à chaque passage du cron toutes les quinze minutes, où l'âge est un
-- proxy fiable de l'effort fourni), une zone d'enrichissement ne revient dans
-- la rotation qu'après tout un tour des autres zones en attente : l'âge
-- écoulé dépend de la longueur de cette file, pas de l'effort réellement
-- fourni. Un compteur direct colle mieux à « dix passages sans résultat,
-- j'arrête ».
--
-- **`enriched_at` existe déjà (migration 013).** Son commentaire d'origine
-- disait « tenté une fois, jamais retenté » — cette migration change cette
-- sémantique : c'est désormais l'horodatage de la DERNIÈRE tentative, plusieurs
-- sont possibles, bornées par `enrichment_attempts`.
--
-- **`agent_zones.enrichment_attempted_at`** fait tourner la sélection de zone
-- en tourniquet (la moins récemment tentée d'abord), même idiome que
-- `report_first_failed_at` pour les renvois de rapport.
--
-- Idempotente : `if not exists` partout, exécutable deux fois sans effet.
-- ---------------------------------------------------------------------------

comment on column public.agent_prospects.enriched_at is
  'Horodatage de la dernière tentative d''enrichissement (rapprochement OSM, '
  'puis extraction sur le site si nécessaire), qu''elle ait trouvé un e-mail '
  'ou non. Plusieurs tentatives sont possibles, bornées par enrichment_attempts.';

alter table public.agent_prospects
  add column if not exists email_source text
    check (email_source in ('osm_tag', 'site_web')),
  add column if not exists enrichment_attempts integer not null default 0;

comment on column public.agent_prospects.email_source is
  'D''où vient email : ''osm_tag'' (porté directement par OpenStreetMap) ou '
  '''site_web'' (relevé par Qualifyr sur le site officiel indiqué par '
  'OpenStreetMap). Toujours renseigné en même temps que email, jamais l''un '
  'sans l''autre — voir composeMessage, qui varie le pied de page selon cette '
  'colonne.';

-- La file d'enrichissement restant à tenter : jamais d'e-mail, pas opposé,
-- sous le plafond de tentatives. Le 10 littéral doit rester synchronisé avec
-- MAX_ENRICHMENT_ATTEMPTS (src/app/api/agent/enrich/route.ts) : un index
-- partiel ne peut pas référencer une constante applicative, et un écart entre
-- les deux ne casserait rien (l'index resterait juste un peu moins précis),
-- mais autant l'éviter.
create index if not exists agent_prospects_enrichable_idx
  on public.agent_prospects (zone_id, created_at)
  where email is null and opted_out_at is null and enrichment_attempts < 10;

alter table public.agent_zones
  add column if not exists enrichment_attempted_at timestamptz;
