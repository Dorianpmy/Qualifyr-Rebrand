-- ---------------------------------------------------------------------------
-- L'agent d'acquisition : zones analysées et prospects trouvés.
--
-- **Deux tables, parce que deux durées de vie.** Une zone appartient au
-- professionnel et vit tant qu'il est client. Un prospect est une donnée
-- concernant un tiers qui n'a rien demandé : le RGPD impose de le purger au
-- bout de trois ans sans interaction. Les mélanger rendrait la purge
-- impossible sans effacer aussi l'historique du professionnel.
--
-- **La source de chaque donnée est stockée.** Le RGPD exige d'informer la
-- personne concernée de l'origine de ses données dès le premier contact. Sans
-- cette colonne, on ne peut pas répondre — et « je ne sais plus d'où ça
-- vient » n'est pas une réponse recevable devant la CNIL.
-- ---------------------------------------------------------------------------

-- --- 1. Les zones demandées ------------------------------------------------

create table if not exists public.agent_zones (
  id uuid primary key default gen_random_uuid(),

  -- Nul tant que la zone vient du formulaire public : le visiteur n'a pas
  -- encore de compte. Rattaché à la première connexion.
  detailer_id uuid references public.detailers(id) on delete cascade,

  -- L'e-mail de capture. C'est la clé qui permet de rattacher une zone
  -- analysée avant inscription au compte créé ensuite.
  email text not null,

  postal_code text not null,
  radius_km integer not null default 15,
  country text not null default 'FR' check (country in ('FR', 'CH')),

  -- La première zone d'un professionnel est offerte ; les suivantes sont
  -- comprises dans l'abonnement. Le drapeau est posé à la création et ne
  -- bouge plus : une zone offerte le reste, même si l'abonnement change.
  is_free boolean not null default true,

  status text not null default 'en_attente'
    check (status in ('en_attente', 'en_cours', 'termine', 'echec')),

  -- Nombre d'établissements retenus, par segment. Stocké en JSON parce que
  -- les segments évolueront — ajouter une colonne par métier obligerait à une
  -- migration à chaque nouveau code NAF.
  segments jsonb,

  error_message text,
  processed_at timestamptz,
  report_sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Une zone par couple e-mail + code postal : sans cette contrainte, un
-- visiteur qui clique trois fois déclenche trois analyses identiques et
-- reçoit trois e-mails.
create unique index if not exists agent_zones_unique
  on public.agent_zones (lower(email), postal_code);

-- La file de traitement : les zones en attente, les plus anciennes d'abord.
create index if not exists agent_zones_pending_idx
  on public.agent_zones (created_at)
  where status = 'en_attente';

alter table public.agent_zones enable row level security;

-- Aucune politique de lecture publique : ces lignes contiennent des adresses
-- e-mail. Seul le service, côté serveur, y accède.

-- --- 2. Les établissements trouvés -----------------------------------------

create table if not exists public.agent_prospects (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.agent_zones(id) on delete cascade,

  -- Identifiant officiel de l'établissement. Il permet de dédoublonner entre
  -- deux zones qui se chevauchent, et de retrouver la fiche à jour.
  siret text,
  name text not null,
  naf_code text,
  segment text not null,

  address text,
  postal_code text,
  city text,

  -- Tranche d'effectif telle que publiée par l'INSEE. Sert au tri : une
  -- flotte de cinquante véhicules ne se démarche pas comme un artisan seul.
  workforce_range text,

  -- Enrichissements facultatifs, ajoutés dans un second temps.
  phone text,
  website text,

  /*
   * Traçabilité RGPD. `source` dit d'où vient la donnée, `legal_basis` sur
   * quel fondement elle est traitée. Les deux doivent être communiqués à la
   * personne concernée dès le premier contact.
   */
  source text not null default 'sirene',
  legal_basis text not null default 'interet_legitime',

  -- Opposition. Une fois posée, elle interdit tout nouveau contact — et la
  -- ligne est conservée précisément pour se souvenir du refus.
  opted_out_at timestamptz,

  contacted_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

-- Un établissement n'apparaît qu'une fois par zone.
create unique index if not exists agent_prospects_unique
  on public.agent_prospects (zone_id, siret)
  where siret is not null;

-- La purge : prospects sans interaction depuis trois ans. La CNIL recommande
-- ce délai pour un prospect inactif.
create index if not exists agent_prospects_stale_idx
  on public.agent_prospects (created_at)
  where contacted_at is null and replied_at is null;

alter table public.agent_prospects enable row level security;
