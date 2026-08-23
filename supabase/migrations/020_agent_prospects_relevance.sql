-- ---------------------------------------------------------------------------
-- agent_prospects — classement par pertinence, calculé une fois après
-- l'analyse de zone.
--
-- **Pourquoi.** Aujourd'hui, `nextCandidates` (lib/agent/outreach.ts)
-- contacte les entreprises d'une zone dans l'ordre où elles sortent de la
-- base. Un laveur spécialisé flottes et un autre qui vise les concessions
-- reçoivent la même file. `relevance_score` porte un classement calculé par
-- un modèle de langage (Mistral) à partir d'une phrase que le professionnel
-- écrit sur son activité (`hermes_campaigns.activity_description`) — voir
-- `lib/agent/relevance.ts`.
--
-- **Le score ordonne, il n'exclut jamais.** `relevance_score` reste nullable
-- indéfiniment : un prospect jamais noté, ou pour lequel le modèle n'a pas
-- répondu, garde `null` et passe simplement en dernier
-- (`nextCandidates` trie `relevance_score desc nulls last`) — jamais retiré
-- de la file.
--
-- **`scored_at` distingue « jamais noté » de « noté, sans score exploitable
-- »** : les deux se traduisent par `relevance_score is null`, mais seul le
-- second ne sera plus jamais retenté (voir le commentaire d'en-tête de
-- `lib/agent/relevance.ts` sur ce que fait `/api/agent/relevance`).
--
-- **`activity_description` sur `hermes_campaigns`, pas sur `agent_zones`.**
-- C'est le professionnel qui décrit son activité une fois, pas la zone :
-- deux zones du même compte partagent la même description.
--
-- Idempotente : `add column if not exists`, `drop constraint if exists` /
-- `add constraint`, exécutable deux fois sans effet.
-- ---------------------------------------------------------------------------

alter table public.agent_prospects
  add column if not exists relevance_score integer,
  add column if not exists scored_at timestamptz;

alter table public.agent_prospects
  drop constraint if exists agent_prospects_relevance_score_range;
alter table public.agent_prospects
  add constraint agent_prospects_relevance_score_range
  check (relevance_score is null or relevance_score between 0 and 100);

-- Sert le tri de `nextCandidates` : les mieux notés d'une zone, en tête.
create index if not exists agent_prospects_zone_relevance_idx
  on public.agent_prospects (zone_id, relevance_score desc);

alter table public.hermes_campaigns
  add column if not exists activity_description text;

alter table public.hermes_campaigns
  drop constraint if exists hermes_campaigns_activity_description_len;
alter table public.hermes_campaigns
  add constraint hermes_campaigns_activity_description_len
  check (activity_description is null or char_length(activity_description) <= 500);
