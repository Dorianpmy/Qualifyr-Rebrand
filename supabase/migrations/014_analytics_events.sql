-- Suivi d'événements — premier jet (22/08/2026, phase 2 de l'audit growth).
--
-- Avant cette migration, aucun outil de mesure n'était installé nulle part
-- sur le site (confirmé dans l'audit growth marketing, §8) : `trackEvent`
-- (src/lib/analytics.ts) poussait déjà les événements dans `window.dataLayer`
-- au format Google Tag Manager, mais rien ne les recevait. Cette table est le
-- collecteur choisi en attendant un éventuel outil tiers (Plausible, GA4…) —
-- volontairement pas de compte tiers créé ici, ce choix revient à Dorian.
-- Premier parti : aucun cookie, écriture uniquement via la clé de service
-- (jamais d'insertion anonyme directe depuis le navigateur), cohérent avec le
-- reste du site qui ne dépose aucun cookie de mesure.

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  page_path text,
  cta_id text,
  -- Identifiant de session côté navigateur (aléatoire, renouvelé à chaque
  -- onglet/session) — permet de relier plusieurs événements sans cookie
  -- persistant ni identifiant personnel.
  session_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer_domain text,
  -- Renseigné uniquement pour les événements déclenchés depuis l'espace pro
  -- (connexion, action dans /app) : permet de distinguer l'activité d'un
  -- professionnel de la navigation anonyme sur le site vitrine.
  detailer_id uuid references public.detailers (id) on delete set null,
  -- Détails propres à un événement (ex. plan/cadence choisis) sans multiplier
  -- les colonnes pour un besoin ponctuel.
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_name_created_idx
  on public.analytics_events (event_name, created_at desc);

create index analytics_events_session_idx
  on public.analytics_events (session_id, created_at);

-- RLS activé, aucune policy : ni `anon` ni `authenticated` ne peuvent lire ou
-- écrire directement. Seule la clé de service (utilisée uniquement dans
-- `/api/track` et les routes serveur qui journalisent un événement) peut y
-- toucher — elle contourne RLS par construction. C'est délibéré : ouvrir
-- l'insertion à `anon` transformerait cette table en cible de pollution par
-- un script tiers.
alter table public.analytics_events enable row level security;

-- ---------------------------------------------------------------------------
-- Lecture hebdomadaire
-- ---------------------------------------------------------------------------
-- Vue de confort pour la question posée chaque semaine : combien
-- d'événements de chaque type, par semaine. À interroger depuis l'éditeur SQL
-- de Supabase (Table Editor > SQL Editor) tant qu'aucun tableau de bord
-- dédié n'existe dans /app — construire cet écran suppose de choisir un
-- modèle d'accès admin distinct du modèle "un compte = un professionnel"
-- actuel, ce qui dépasse cette migration.
--
-- Exemple d'usage :
--   select * from public.analytics_weekly_funnel
--   where week >= date_trunc('week', now()) - interval '8 weeks'
--   order by week desc, event_count desc;
create or replace view public.analytics_weekly_funnel as
select
  date_trunc('week', created_at) as week,
  event_name,
  count(*) as event_count,
  count(distinct session_id) as distinct_sessions
from public.analytics_events
group by 1, 2;
