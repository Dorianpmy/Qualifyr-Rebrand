-- ---------------------------------------------------------------------------
-- Mode d'encaissement manuel (virement ou lien PayPal personnel).
--
-- Référence : docs/18-options-paiement-acompte.md. Jusqu'ici, un seul
-- prestataire existait (Stripe Connect Express, migration 009) et son
-- absence était un simple repli implicite (`stripe_charges_enabled = false`).
-- Ce mode devient un choix explicite du professionnel, avec deux moyens
-- possibles quand il l'active.
--
-- `payment_mode` par défaut à 'stripe' : aucun compte existant ne change de
-- comportement tant que le professionnel n'a rien choisi lui-même.
-- ---------------------------------------------------------------------------

alter table public.detailers
  add column if not exists payment_mode text
    not null default 'stripe'
    check (payment_mode in ('stripe', 'manuel'));

-- Les deux moyens du mode manuel. `iban` existe déjà (migration 012, saisi
-- pour la QR-facture suisse) et est réutilisé tel quel — pas de duplication.
alter table public.detailers
  add column if not exists manual_method text
    check (manual_method in ('virement', 'paypal_lien')),
  add column if not exists paypal_link text;

-- Traçabilité de la confirmation d'un acompte : distingue une confirmation
-- automatique (webhook Stripe) d'une confirmation manuelle (le professionnel
-- a cliqué), utile en cas de litige client et pour l'audit interne — sans
-- rien promettre au client sur la fiabilité de l'une ou l'autre.
alter table public.detailer_bookings
  add column if not exists deposit_confirmed_by text
    check (deposit_confirmed_by in ('webhook_stripe', 'manuel')),
  add column if not exists deposit_confirmed_by_user_id uuid references auth.users(id);
