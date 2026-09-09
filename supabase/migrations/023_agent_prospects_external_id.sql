-- ---------------------------------------------------------------------------
-- agent_prospects — un identifiant pour les entreprises sans SIRET.
--
-- Le recensement suisse s'appuie sur Google Places (voir
-- `lib/agent/google-places.ts`), et une entreprise suisse n'a pas de SIRET.
-- Or la protection contre les doublons repose entièrement dessus :
-- `agent_prospects_unique` porte sur `(zone_id, siret)` et ne s'applique
-- qu'aux lignes où il est renseigné.
--
-- **Sans identifiant de substitution, deux analyses de la même zone
-- créeraient deux fois les mêmes entreprises** — et Hermès écrirait deux fois
-- à chacune. Le dédoublonnage par adresse de `nextCandidates` rattraperait
-- une partie des cas, mais seulement ceux où l'e-mail a déjà été trouvé : un
-- prospect en double avant enrichissement passerait au travers.
--
-- `external_id` porte l'identifiant Google (`places.id`), stable dans le
-- temps. Il reste `null` pour tout ce qui vient de Sirene, où le SIRET fait
-- ce travail.
--
-- Idempotente : `if not exists` partout, exécutable deux fois sans effet.
-- ---------------------------------------------------------------------------

alter table public.agent_prospects
  add column if not exists external_id text;

comment on column public.agent_prospects.external_id is
  'Identifiant de la source externe (place_id Google) pour les établissements '
  'sans SIRET. Null pour Sirene, où le SIRET assure la déduplication.';

-- Symétrique d'`agent_prospects_unique` (migration 010), et partiel pour la
-- même raison : il ne doit contraindre que les lignes qui portent la clé.
create unique index if not exists agent_prospects_external_unique
  on public.agent_prospects (zone_id, external_id)
  where external_id is not null;
