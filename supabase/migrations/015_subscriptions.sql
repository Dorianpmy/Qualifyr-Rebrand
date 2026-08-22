-- ---------------------------------------------------------------------------
-- Abonnements Qualifyr — le chaînon manquant entre Stripe et l'accès au SaaS.
--
-- Avant cette migration, payer ne donnait accès à rien : le webhook
-- (`api/billing/webhook/route.ts`) vérifiait la signature, journalisait, et
-- s'arrêtait — faute d'un endroit où écrire « ce compte a tel abonnement ».
-- L'accès à `/app` tenait à la seule existence d'une fiche `detailers`, et les
-- trois offres vendues n'avaient aucune existence technique.
--
-- Cette table est cet endroit. Elle est la source de vérité des droits ;
-- `lib/billing/entitlements.ts` la lit, et rien d'autre ne décide d'un accès.
--
-- **Rattachée à `auth.users`, pas à `detailers`.** Un abonné « Agent seul »
-- n'a pas de fiche detailer : il ne vend rien, il reçoit des rapports de
-- secteur. Rattacher l'abonnement à la fiche aurait rendu ce plan
-- impossible à provisionner.
--
-- **Idempotente.** `if not exists` partout, `drop policy if exists` avant
-- chaque création : rejouable sans erreur sur une base déjà migrée.
-- ---------------------------------------------------------------------------

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),

  -- Le propriétaire des droits. `on delete cascade` : un compte supprimé
  -- n'a plus d'abonnement, et laisser une ligne orpheline accorderait des
  -- droits à un identifiant réattribuable.
  owner_id uuid not null references auth.users(id) on delete cascade,

  -- Références Stripe. Aucun secret n'est stocké : ce sont des identifiants
  -- opaques, sans valeur hors du compte Stripe de Qualifyr. Ni carte, ni
  -- token, ni adresse ne transitent par cette table.
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,

  -- `agent`, `system`, `complete`. Les métadonnées Stripe portent encore les
  -- valeurs françaises historiques (`systeme`, `complet`) : la traduction se
  -- fait dans `lib/billing/plans.ts`, en un seul endroit.
  plan text not null,

  billing_interval text not null default 'month',
  status text not null default 'incomplete',

  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Valeurs autorisées.
--
-- En contrainte plutôt qu'en type énuméré : ajouter une offre à un `enum`
-- Postgres impose un `alter type` qui ne peut pas tourner dans la même
-- transaction que son utilisation, ce qui complique tout déploiement futur.
-- Une contrainte `check` se remplace par un simple `drop`/`add`.
-- ---------------------------------------------------------------------------

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions
  add constraint subscriptions_plan_check
  check (plan in ('agent', 'system', 'complete'));

alter table public.subscriptions
  drop constraint if exists subscriptions_status_check;
alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in (
    'trialing',
    'active',
    'past_due',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'unpaid'
  ));

alter table public.subscriptions
  drop constraint if exists subscriptions_interval_check;
alter table public.subscriptions
  add constraint subscriptions_interval_check
  check (billing_interval in ('month', 'year'));

-- ---------------------------------------------------------------------------
-- Index et unicité.
-- ---------------------------------------------------------------------------

create index if not exists subscriptions_owner_id_idx
  on public.subscriptions (owner_id);

create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);

create index if not exists subscriptions_status_idx
  on public.subscriptions (status);

-- **La clé de l'idempotence du webhook.** Stripe garantit « au moins une
-- fois », jamais « exactement une fois » : le même événement peut arriver
-- deux fois. Cet index unique permet au webhook de faire un `upsert` sur
-- `stripe_subscription_id` — rejouer un événement met alors la ligne à jour
-- au lieu d'en créer une seconde.
--
-- Partiel (`where ... is not null`) : plusieurs lignes peuvent légitimement
-- ne pas avoir d'identifiant Stripe (abonnement créé à la main, essai
-- interne), et Postgres considère deux `null` comme distincts de toute
-- façon — l'index partiel rend cette intention explicite.
create unique index if not exists subscriptions_stripe_subscription_id_key
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Un seul abonnement en cours par propriétaire.
--
-- « En cours » couvre `trialing`, `active` et `past_due` : un impayé reste
-- l'abonnement courant du compte, sans quoi un second pourrait être créé
-- pendant la période de grâce. Les états terminaux (`canceled`, `unpaid`,
-- `incomplete_expired`) sont exclus : l'historique doit pouvoir empiler
-- plusieurs abonnements résiliés pour un même compte, et rien ne doit être
-- supprimé à la résiliation.
create unique index if not exists subscriptions_one_live_per_owner
  on public.subscriptions (owner_id)
  where status in ('trialing', 'active', 'past_due');

-- ---------------------------------------------------------------------------
-- `updated_at` tenu par la base, pas par le code applicatif.
--
-- Le webhook n'est pas le seul écrivain possible (correction manuelle,
-- script de rattrapage) : confier l'horodatage à l'application garantirait
-- qu'il finisse par mentir.
-- ---------------------------------------------------------------------------

create or replace function public.set_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_subscriptions_updated_at();

-- ---------------------------------------------------------------------------
-- RLS.
--
-- **Lecture seule pour le propriétaire, aucune écriture pour personne.**
-- L'interface a besoin de lire le plan pour afficher « Pack complet, échéance
-- le 14 mars ». Elle n'a jamais besoin d'écrire : accorder une écriture,
-- même restreinte à ses propres lignes, permettrait à un client de passer son
-- plan de `agent` à `complete` depuis le navigateur. Seule la clé de service,
-- qui contourne RLS, écrit ici — et elle ne vit que dans le webhook, côté
-- serveur.
-- ---------------------------------------------------------------------------

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_owner_select on public.subscriptions;
create policy subscriptions_owner_select on public.subscriptions
  for select
  using (owner_id = auth.uid());

comment on table public.subscriptions is
  'Source de vérité des droits d''accès. Écrite uniquement par le webhook Stripe (clé de service) ; lue par lib/billing/entitlements.ts.';
