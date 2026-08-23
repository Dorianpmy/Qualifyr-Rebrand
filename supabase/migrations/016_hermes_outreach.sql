-- ---------------------------------------------------------------------------
-- Hermès — prospection sortante.
--
-- L'agent recensait et rapportait. Il envoie désormais, au nom du
-- professionnel, aux entreprises qu'il a recensées.
--
-- **`agent_prospects` était déjà prêt** : `email`, `unsubscribe_token`,
-- `opted_out_at`, `contacted_at`, `replied_at`, et un index partiel sur les
-- prospects contactables. Cette migration n'ajoute que ce qui manquait autour.
--
-- **Trois objets, trois rôles distincts :**
--
-- 1. `hermes_campaigns` — ce que le professionnel a signé **une fois**. Sans
--    ligne ici, aucun envoi n'est possible pour ce compte. C'est le seul
--    consentement du parcours, et il est explicite.
-- 2. `hermes_messages` — la trace de chaque envoi. Sans elle, impossible de
--    répondre à une réclamation ni de prouver ce qui a été envoyé à qui.
-- 3. `hermes_suppressions` — les adresses à ne plus jamais contacter, **tous
--    professionnels confondus**. C'est le point le plus important du fichier,
--    et la raison est développée sur la table elle-même.
--
-- Idempotente : `if not exists` partout, exécutable deux fois sans effet.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Campagnes — le consentement du professionnel
-- ---------------------------------------------------------------------------

create table if not exists public.hermes_campaigns (
  id uuid primary key default gen_random_uuid(),

  -- Rattachée à `auth.users`, pas à `detailers` — même raison que pour
  -- `subscriptions` (migration 015) : un abonné « Agent seul » n'a pas de
  -- fiche detailer, il ne vend rien, il reçoit des rapports. Or c'est
  -- précisément lui le premier client d'Hermès. Rattacher la campagne à
  -- `detailers` aurait exclu du produit ceux à qui il est destiné.
  owner_id uuid not null references auth.users(id) on delete cascade,

  -- Identité affichée dans le message. Elle vient du professionnel, jamais de
  -- Qualifyr : le destinataire doit savoir qui lui écrit, et ce n'est pas nous.
  sender_name text not null,
  reply_to_email text not null,

  -- Le corps du message, écrit et relu par le professionnel. `{{entreprise}}`
  -- et `{{ville}}` y sont remplacés à l'envoi — pas davantage : un gabarit à
  -- vingt variables produit des phrases bancales que personne ne relit.
  subject text not null,
  body text not null,

  -- Nombre maximum d'envois par jour pour ce compte.
  --
  -- Plafonné à 40 par la contrainte plus bas, et ce n'est pas une limite
  -- technique : au-delà, un expéditeur récent ressemble à un émetteur de masse
  -- pour les filtres de Google et Microsoft, et l'ensemble du sous-domaine perd
  -- sa réputation. Quarante messages par jour sur un fichier local, c'est déjà
  -- plus que ce qu'un artisan enverrait à la main en une semaine.
  daily_quota int not null default 15,

  -- Interrupteur du professionnel, et interrupteur de Dorian. Deux colonnes
  -- distinctes plutôt qu'un seul statut : couper un compte depuis
  -- l'administration ne doit pas pouvoir être annulé par le professionnel
  -- lui-même en rouvrant son écran de réglages.
  paused_at timestamptz,
  suspended_at timestamptz,
  suspended_reason text,

  -- Trace du consentement. Le professionnel accepte d'être l'expéditeur et
  -- assume le contenu ; c'est ce qui fait de lui le responsable de traitement
  -- et de Qualifyr un sous-traitant.
  terms_accepted_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hermes_campaigns_quota_sane check (daily_quota between 1 and 40),
  constraint hermes_campaigns_subject_len check (char_length(subject) between 5 and 150),
  constraint hermes_campaigns_body_len check (char_length(body) between 50 and 4000)
);

-- Une seule campagne par professionnel. Deux campagnes actives doubleraient le
-- quota sans que personne ne s'en aperçoive.
create unique index if not exists hermes_campaigns_owner_idx
  on public.hermes_campaigns (owner_id);

-- ---------------------------------------------------------------------------
-- 2. Messages — le journal
-- ---------------------------------------------------------------------------

create table if not exists public.hermes_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.hermes_campaigns(id) on delete cascade,
  prospect_id uuid not null references public.agent_prospects(id) on delete cascade,

  -- L'adresse au moment de l'envoi. Dupliquée volontairement depuis
  -- `agent_prospects` : si le prospect est supprimé ou son e-mail corrigé, le
  -- journal doit rester exact. Un journal qui se réécrit ne prouve rien.
  to_email text not null,
  subject text not null,
  body text not null,

  status text not null default 'sent',
  provider_id text,
  error text,

  sent_at timestamptz not null default now(),

  constraint hermes_messages_status_known
    check (status in ('sent', 'failed', 'bounced', 'complained'))
);

-- Un prospect n'est contacté qu'une fois par campagne. La contrainte est ici,
-- en base, et pas seulement dans le code : c'est la seule barrière qui tienne
-- si deux exécutions du planificateur se chevauchent.
create unique index if not exists hermes_messages_once_idx
  on public.hermes_messages (campaign_id, prospect_id);

-- Sert au décompte du quota quotidien, appelé à chaque passage.
create index if not exists hermes_messages_campaign_day_idx
  on public.hermes_messages (campaign_id, sent_at desc);

-- ---------------------------------------------------------------------------
-- 3. Suppressions — la liste globale
-- ---------------------------------------------------------------------------

create table if not exists public.hermes_suppressions (
  -- L'adresse en minuscules fait la clé : deux écritures d'une même adresse ne
  -- doivent pas produire deux lignes, sans quoi la suppression serait
  -- contournée par une simple majuscule.
  email text primary key,

  -- Pourquoi cette adresse ne doit plus être contactée.
  reason text not null,

  -- Le compte à l'origine de l'envoi qui a déclenché la suppression.
  -- Informatif : la suppression vaut pour tous, quel qu'il soit.
  source_owner_id uuid references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),

  constraint hermes_suppressions_reason_known
    check (reason in ('unsubscribed', 'bounced', 'complained', 'manual'))
);

comment on table public.hermes_suppressions is
  'Adresses à ne plus jamais contacter, tous professionnels confondus. '
  'La portée globale est délibérée : une entreprise qui se désinscrit d''un '
  'message envoyé par un laveur ne comprend pas — et n''a pas à comprendre — '
  'qu''un autre laveur utilise le même outil. Recevoir un second message après '
  's''être désinscrit est ce qui déclenche une plainte, et une plainte porte '
  'sur le domaine expéditeur, donc sur tous les comptes à la fois.';

-- ---------------------------------------------------------------------------
-- 4. Droits d'accès
--
-- Lecture seule pour le professionnel, sur ses propres lignes. Toute écriture
-- passe par le serveur avec la clé de service : un envoi ne doit jamais
-- pouvoir être déclenché depuis le navigateur, et un journal ne doit jamais
-- pouvoir être modifié après coup.
-- ---------------------------------------------------------------------------

alter table public.hermes_campaigns enable row level security;
alter table public.hermes_messages enable row level security;
alter table public.hermes_suppressions enable row level security;

drop policy if exists hermes_campaigns_owner_select on public.hermes_campaigns;
create policy hermes_campaigns_owner_select
  on public.hermes_campaigns for select
  using (owner_id = auth.uid());

drop policy if exists hermes_messages_owner_select on public.hermes_messages;
create policy hermes_messages_owner_select
  on public.hermes_messages for select
  using (
    exists (
      select 1 from public.hermes_campaigns c
      where c.id = hermes_messages.campaign_id
        and c.owner_id = auth.uid()
    )
  );

-- Aucune politique de lecture sur `hermes_suppressions` : la liste contient
-- les adresses de tiers qui ont demandé à ne plus être contactés. La rendre
-- lisible par un professionnel en ferait un fichier exploitable ailleurs.

-- ---------------------------------------------------------------------------
-- 5. `updated_at`
-- ---------------------------------------------------------------------------

-- Une fonction dédiée plutôt qu'une fonction partagée : c'est la convention
-- du dépôt (voir `set_subscriptions_updated_at` en 015), et une fonction
-- générique `touch_updated_at()` n'existe pas ici. La supposer aurait fait
-- échouer la migration à l'exécution, pas à l'écriture.
create or replace function public.set_hermes_campaigns_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hermes_campaigns_set_updated_at on public.hermes_campaigns;
create trigger hermes_campaigns_set_updated_at
  before update on public.hermes_campaigns
  for each row
  execute function public.set_hermes_campaigns_updated_at();
