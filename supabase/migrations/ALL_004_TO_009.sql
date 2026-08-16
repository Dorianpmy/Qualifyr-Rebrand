-- ===========================================================================
-- Qualifyr — migrations 004 à 009, réunies pour un passage unique.
--
-- À coller dans le SQL Editor de Supabase, puis « Run ». Une seule fois.
--
-- CORRECTION DU 15/08 : la version précédente référençait une table
-- `public.bookings` qui n'existe pas — la table s'appelle `detailer_bookings`.
-- La transaction avait donc tout annulé, ce qui est exactement son rôle :
-- aucune colonne n'a été créée, la base est restée intacte.
--
-- **Pourquoi un fichier unique.** Les six migrations doivent passer dans
-- l'ordre : la 009 ajoute des colonnes à des tables que la 006 et la 007
-- créent ou modifient. Six copier-coller successifs, c'est cinq occasions
-- d'en sauter un — et une colonne manquante ne se voit qu'au moment où un
-- client paie.
--
-- **Rejouable sans risque.** Tout est en `IF NOT EXISTS` ou gardé par un test
-- d'existence. Relancer ce fichier ne casse rien et ne duplique rien.
--
-- **Une exception : la section 008.** Elle efface et réinsère les
-- réservations de démonstration du detailer `demo`. C'est voulu — ce sont des
-- données de test. Elle ne touche à aucune autre fiche.
-- ===========================================================================

BEGIN;



-- ===========================================================================
-- 004_country_and_proof.sql
-- ===========================================================================

-- Marché suisse : chaque fiche déclare son pays.
--
-- Le défaut 'FR' est délibéré : les fiches existantes doivent continuer à
-- afficher des euros et une TVA à 20 %. La contrainte interdit toute autre
-- valeur — un pays mal orthographié produirait silencieusement une facture
-- française pour un professionnel suisse.

ALTER TABLE detailers
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'FR';

ALTER TABLE detailers
  DROP CONSTRAINT IF EXISTS detailers_country_check;

ALTER TABLE detailers
  ADD CONSTRAINT detailers_country_check CHECK (country IN ('FR', 'CH'));

-- Arguments de réassurance affichés sur la page publique.
--
-- Stockés par fiche plutôt qu'écrits en dur : un professionnel qui ne se
-- déplace pas ne doit pas promettre une intervention à domicile, et un
-- professionnel sans assurance ne doit pas l'afficher.

ALTER TABLE detailers
  ADD COLUMN IF NOT EXISTS free_cancellation_hours integer NOT NULL DEFAULT 24;

ALTER TABLE detailers
  ADD COLUMN IF NOT EXISTS insurance_label text;

ALTER TABLE detailers
  ADD COLUMN IF NOT EXISTS years_experience integer;

ALTER TABLE detailers
  ADD COLUMN IF NOT EXISTS intro text;


-- ===========================================================================
-- 005_catalogue_unique.sql
-- ===========================================================================

-- Contraintes d'unicité requises par l'éditeur de prestations.
--
-- L'enregistrement utilise `upsert` : sans contrainte unique sur ces triplets,
-- Postgres n'a aucun moyen de savoir qu'une ligne existe déjà et chaque
-- sauvegarde créerait un doublon. Le tunnel lirait alors deux tarifs pour la
-- même prestation et retiendrait celui que le hasard de l'ordre de tri lui
-- donne — un prix qui change sans raison entre deux visites.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'detailer_prices_unique'
  ) THEN
    ALTER TABLE detailer_prices
      ADD CONSTRAINT detailer_prices_unique UNIQUE (detailer_id, scope, vehicle_size);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'detailer_options_unique'
  ) THEN
    ALTER TABLE detailer_options
      ADD CONSTRAINT detailer_options_unique UNIQUE (detailer_id, option_key);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'detailer_soiling_unique'
  ) THEN
    ALTER TABLE detailer_soiling
      ADD CONSTRAINT detailer_soiling_unique UNIQUE (detailer_id, level);
  END IF;
END $$;


-- ===========================================================================
-- 006_scope_labels.sql
-- ===========================================================================

-- Nom commercial des formules, choisi par le professionnel.
--
-- « Intérieur », « Extérieur », « Complet » décrivent un périmètre technique,
-- pas une offre. Les professionnels vendent des « Formule Éclat », des
-- « Remise à neuf », des « Pack Restitution LOA » — et un client qui a vu
-- « Formule Éclat » sur Instagram doit retrouver ce nom-là au moment de
-- réserver, sinon il croit s'être trompé de page.
--
-- Le périmètre technique (`scope`) reste inchangé : c'est lui qui pilote le
-- calcul du devis. Seul l'habillage est libre. Renommer une formule ne doit
-- jamais modifier un prix ni une durée.

CREATE TABLE IF NOT EXISTS detailer_scope_labels (
  detailer_id uuid NOT NULL REFERENCES detailers(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('interieur', 'exterieur', 'complet')),
  label text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (detailer_id, scope)
);

ALTER TABLE detailer_scope_labels ENABLE ROW LEVEL SECURITY;

-- Lisible publiquement pour les fiches en ligne : la page de réservation doit
-- afficher ces noms sans session.
DROP POLICY IF EXISTS detailer_scope_labels_public_select ON detailer_scope_labels;
CREATE POLICY detailer_scope_labels_public_select ON detailer_scope_labels
  FOR SELECT
  USING (
    detailer_id IN (
      SELECT id FROM detailers WHERE published = true OR owner_id = auth.uid()
    )
  );


-- ===========================================================================
-- 007_addresses.sql
-- ===========================================================================

-- Adresse exacte d'intervention.
--
-- Jusqu'ici, le client saisissait un code postal et **estimait lui-même** la
-- distance jusqu'au professionnel, alors que c'est cette distance qui
-- détermine les frais de déplacement. Autant demander au client de fixer une
-- partie de son propre prix : sous-estimée, le professionnel roule à perte ;
-- surestimée, la réservation est perdue pour un montant qui n'existe pas.
--
-- L'adresse géocodée remplace la devinette. La distance devient calculée, et
-- le professionnel sait où se garer.

ALTER TABLE detailer_bookings
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS access_note text;

-- Point de départ du professionnel : sans lui, aucune distance n'est
-- calculable. Séparé de `workshop_address`, qui est une adresse d'accueil
-- affichée aux clients et pas nécessairement le point de départ des tournées.
ALTER TABLE detailers
  ADD COLUMN IF NOT EXISTS base_address text,
  ADD COLUMN IF NOT EXISTS base_latitude double precision,
  ADD COLUMN IF NOT EXISTS base_longitude double precision;


-- ===========================================================================
-- 008_seed_detailer_bookings.sql
-- ===========================================================================

-- Migration 008 : injection de réservations de démonstration pour le detailer 'demo'
-- Nécessaire pour le test du tunnel de réservation et du dashboard.
-- Les 4 réservations couvrent les statuts : confirme, en_attente_paiement, realise.
-- Les créneaux sont espacés pour éviter les conflits d'exclusion (exclusion constraint
-- detailer_bookings_no_overlap sur detailer_id, slot).

-- Nettoyage préalable : supprimer les anciennes démos si elles existent.
delete from detailer_bookings
where detailer_id in (select id from detailers where slug = 'demo');

insert into detailer_bookings (
  detailer_id, status, email, phone,
  vehicle_size, vehicle_model, plate,
  scope, soiling, location_mode, postal_code,
  quoted_price, quoted_minutes, deposit_amount,
  slot, hold_expires_at
)
select d.id, v.status, v.email, v.phone,
       v.size, v.model, v.plate,
       v.scope, v.soiling, v.loc, v.cp,
       v.price, v.minutes, round(v.price * 0.3),
       -- Créneaux disjoints : chaque départ + durée ne chevauche pas le suivant.
       -- 1) 3h  → [3h, 7h]   (240 min)
       -- 2) 7h  → [7h, 9h]   (120 min)
       -- 3) 9h  → [9h, 10.5h](90 min)
       -- 4) 11h → [11h, 16h] (300 min)
       tstzrange(now() + v.startd, now() + v.startd + (v.minutes || ' minutes')::interval),
       v.hold
from detailers d
cross join (values
  ('confirme',            'marc.leroy@gmail.com',   '06 12 34 56 78', 'suv',        'Tiguan',   'FT-482-QL', 'complet',   'poils_taches', 'domicile', '69003', 289, 240, null::timestamptz, interval '3 hours'),
  ('en_attente_paiement', 'sophie.bernard@sfr.fr',  '07 88 21 05 33', 'citadine',   'Clio V',   'GK-119-BR', 'interieur', 'tres_sale',    'atelier',  null,   129, 120, now() + interval '8 minutes', interval '7 hours'),
  ('confirme',            'a.diallo@outlook.fr',    '06 45 90 12 76', 'berline',    'Passat',   'DR-702-ZM', 'exterieur', 'normal',       'domicile', '69007', 159, 90,  null,                       interval '9 hours'),
  ('realise',             'contact@transports-py.fr','04 78 55 21 09','utilitaire', 'Jumpy',    'EV-330-TC', 'complet',   'tres_sale',    'atelier',  null,   349, 300, null,                       interval '11 hours')
) as v(status, email, phone, size, model, plate, scope, soiling, loc, cp, price, minutes, hold, startd)
where d.slug = 'demo';


-- ===========================================================================
-- 009_payments_and_completion.sql
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Encaissement de l'acompte, fin de prestation, demande d'avis.
--
-- Trois sujets dans une même migration parce qu'ils décrivent une seule
-- chose : le cycle de vie d'une réservation après le clic du client. Les
-- séparer obligerait à passer trois migrations dans le bon ordre pour un
-- résultat cohérent — et l'ordre est précisément ce qui se perd.
--
-- **Aucun montant n'est stocké en centimes ici.** Le reste du schéma raisonne
-- en unité monétaire ; introduire les centimes sur les seules colonnes Stripe
-- créerait deux conventions dans la même table, et l'erreur d'un facteur 100
-- arriverait le jour d'un vrai paiement.
-- ---------------------------------------------------------------------------

-- --- 1. Le compte de paiement du professionnel -----------------------------

-- Stripe Connect Express : le professionnel remplit un formulaire hébergé par
-- Stripe, pas un compte Stripe complet. L'argent va directement chez lui ;
-- Qualifyr n'est jamais dépositaire des fonds, ce qui évite d'avoir à devenir
-- établissement de paiement.
alter table public.detailers
  add column if not exists stripe_account_id text,
  -- `charges_enabled` est renvoyé par Stripe et ne se déduit pas de la seule
  -- existence du compte : un dossier peut être créé, incomplet, et refuser
  -- tout paiement. Le tunnel doit lire cet état, pas la présence de l'id.
  add column if not exists stripe_charges_enabled boolean NOT NULL DEFAULT false,
  add column if not exists stripe_onboarded_at timestamptz;

-- Fiche Google du professionnel, pour la demande d'avis.
-- Google n'expose aucune API de dépôt d'avis : on envoie le client vers le
-- formulaire officiel, dont l'URL ne demande que cet identifiant.
alter table public.detailers
  add column if not exists google_place_id text,
  -- Numéro WhatsApp au format international, sans espaces ni séparateurs.
  -- Distinct du téléphone affiché : un professionnel peut publier un fixe et
  -- recevoir ses notifications sur son portable.
  add column if not exists whatsapp_from text;

-- --- 2. Le paiement d'une réservation --------------------------------------

alter table public.detailer_bookings
  add column if not exists stripe_payment_intent_id text,
  add column if not exists deposit_paid_at timestamptz,

  -- --- 3. Fin de prestation et avis ---------------------------------------

  -- Renseigné par le professionnel depuis son tableau de bord, au moment où
  -- il rend le véhicule. C'est cet horodatage qui déclenche le message au
  -- client, et non un changement de statut : un statut peut être corrigé
  -- plusieurs fois, une date de fin ne se produit qu'une fois.
  add column if not exists completed_at timestamptz,

  -- Les deux envois sont tracés séparément parce qu'ils partent à des moments
  -- différents et peuvent échouer indépendamment. Sans ces colonnes, une
  -- reprise après incident renverrait le message à quelqu'un qui l'a déjà eu.
  add column if not exists ready_notified_at timestamptz,
  add column if not exists review_requested_at timestamptz;

create index if not exists detailer_bookings_completed_idx
  on public.detailer_bookings (completed_at)
  where completed_at is not null;

-- La file d'envoi des demandes d'avis : les réservations terminées dont
-- l'avis n'a pas encore été demandé, et dont la fin remonte à plus de trois
-- heures. Le délai n'est pas cosmétique — une demande envoyée pendant que le
-- client sort son portefeuille arrive avant qu'il ait regardé la voiture au
-- soleil.
create index if not exists detailer_bookings_review_pending_idx
  on public.detailer_bookings (completed_at)
  where completed_at is not null and review_requested_at is null;


COMMIT;
