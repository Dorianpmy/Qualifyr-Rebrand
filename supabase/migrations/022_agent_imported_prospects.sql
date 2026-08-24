-- ---------------------------------------------------------------------------
-- Hermès — listes de prospects importées par le professionnel.
--
-- **Pourquoi ce n'est pas `agent_prospects`.** Cette table recense les
-- établissements que Sirene/OpenStreetMap ont fait trouver à Qualifyr —
-- zone, code NAF, tranche d'effectif, score de pertinence : tout un
-- vocabulaire de recensement qui n'a pas de sens pour une liste que le
-- professionnel apporte déjà constituée. Un `zone_id` nullable aurait forcé
-- `nextCandidates`, `/api/agent/relevance` et `dashboard.ts` à une branche
-- `zone_id XOR owner_id` chacun ; une table séparée les laisse inchangés.
--
-- **Périmètre par `owner_id`, pas par zone.** Plus direct que le pont
-- `agent_zones.email ilike ownerEmail` qu'utilise le recensement : une liste
-- importée est toujours créée par un compte authentifié, il n'y a pas de
-- zone anonyme à réconcilier après coup.
--
-- **Deux tables, deux régimes de suppression.** `agent_imported_prospects`
-- porte des données personnelles de tiers : effaçables à la demande.
-- `agent_import_attestations` est la preuve d'un engagement contractuel :
-- elle doit survivre à la suppression des adresses qu'elle couvrait, sinon
-- un professionnel qui supprime sa liste après une réclamation efface au
-- passage la preuve qu'il avait certifié en connaître l'origine. Aucune
-- route de ce projet ne doit jamais supprimer une ligne de
-- `agent_import_attestations` ; la contrainte `on delete restrict`
-- ci-dessous le rend impossible même par erreur tant que des adresses la
-- référencent encore, et rien ne référence son propre effacement.
--
-- **`email_source` fixé à une seule valeur, en colonne plutôt qu'implicite.**
-- Toute ligne de cette table n'a qu'une origine possible : fournie par
-- l'expéditeur. La coder quand même en colonne évite qu'un futur lecteur qui
-- interroge cette table directement (hors du code applicatif) ait à
-- « se souvenir » de la règle — même raisonnement que `agent_prospects.source`.
--
-- **Pas de téléphone.** Hermès n'appelle personne, et le rapport de secteur
-- (qui justifie de collecter le téléphone pour les prospects recensés) ne
-- concerne pas les listes importées. Une donnée sans finalité n'est pas
-- collectée « au cas où ».
--
-- Idempotente : `if not exists` partout, exécutable deux fois sans effet.
-- ---------------------------------------------------------------------------

create table if not exists public.agent_import_attestations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,

  -- La formulation exacte acceptée ce jour-là, pas un booléen. Voir le texte
  -- dans `lib/agent/import-prospects.ts` (IMPORT_ATTESTATION_TEXT) — stocké
  -- ici tel quel plutôt que reconstruit depuis une clé de version, pour que
  -- la preuve reste lisible même si le texte change plus tard.
  statement_text text not null,

  -- Combien d'adresses cette attestation couvrait au moment de l'import —
  -- utile même après suppression des lignes qu'elle référençait.
  row_count integer not null check (row_count > 0),

  accepted_at timestamptz not null default now()
);

comment on table public.agent_import_attestations is
  'Preuve d''engagement, jamais supprimée par une route applicative — voir '
  'le commentaire d''en-tête de la migration 022.';

create table if not exists public.agent_imported_prospects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,

  -- `restrict` et non `cascade` : supprimer les adresses d'un import ne doit
  -- jamais pouvoir supprimer l'attestation qui les couvrait. Puisque aucune
  -- route ne supprime jamais une attestation, cette contrainte ne devrait
  -- jamais se déclencher — elle protège contre une régression future, pas
  -- contre un usage prévu.
  attestation_id uuid not null references public.agent_import_attestations(id) on delete restrict,

  name text not null,
  email text not null,
  email_source text not null default 'fourni_par_expediteur'
    check (email_source = 'fourni_par_expediteur'),

  unsubscribe_token uuid not null default gen_random_uuid(),
  opted_out_at timestamptz,
  contacted_at timestamptz,
  replied_at timestamptz,

  created_at timestamptz not null default now()
);

create unique index if not exists agent_imported_prospects_unsubscribe_token_idx
  on public.agent_imported_prospects (unsubscribe_token);

-- Une adresse ne compte qu'une fois par compte, même importée deux fois à
-- des dates différentes : garde-fou en base derrière la vérification de
-- l'import (voir `import-prospects.ts`), pas un remplacement.
create unique index if not exists agent_imported_prospects_owner_email_idx
  on public.agent_imported_prospects (owner_id, lower(email));

-- La file de contact, même idiome que `agent_prospects_contactable_idx`
-- (migration 013).
create index if not exists agent_imported_prospects_contactable_idx
  on public.agent_imported_prospects (owner_id, created_at)
  where opted_out_at is null and contacted_at is null;

alter table public.agent_import_attestations enable row level security;
alter table public.agent_imported_prospects enable row level security;

-- Aucune politique de lecture publique sur l'une ou l'autre table : la
-- première contient l'e-mail du compte et un texte contractuel, la seconde
-- des coordonnées de tiers. Même régime que `agent_prospects`
-- (migration 010) : accès exclusivement via le service, côté serveur, avec
-- vérification explicite de `owner_id` dans le code applicatif.
