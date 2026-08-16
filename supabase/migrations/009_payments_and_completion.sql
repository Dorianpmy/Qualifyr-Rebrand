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
