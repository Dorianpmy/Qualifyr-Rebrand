-- ---------------------------------------------------------------------------
-- Expiration des blocages de créneau pendant le paiement.
--
-- Référence : docs/13-saas-nettoyage-automobile.md §2.5 (07/11/2026).
--
-- Jusqu'ici, rien ne passait une réservation en `expire` : un client qui
-- fermait son onglet avant de payer bloquait le créneau pour toujours, dans
-- la liste des créneaux comme dans la contrainte d'exclusion
-- `detailer_bookings_no_overlap`. L'application fait désormais expirer ces
-- lignes (avant chaque nouvelle réservation, via le webhook
-- `checkout.session.expired` et toutes les cinq minutes par
-- `booking-expire-cron`). Cette migration prépare la base à ce traitement.
--
-- Idempotente : peut être rejouée sans effet de bord.
-- ---------------------------------------------------------------------------

-- 1. Index de la requête d'expiration :
--    status = 'en_attente_paiement' and hold_expires_at < now()
--    Partiel : seules les lignes en attente avec un blocage sont concernées.
create index if not exists detailer_bookings_pending_hold_idx
  on public.detailer_bookings (hold_expires_at)
  where status = 'en_attente_paiement' and hold_expires_at is not null;

-- 2. Remise à plat des blocages qui n'auraient jamais dû exister.
--
--    Avant le 07/11/2026, toute réservation recevait un blocage de quinze
--    minutes, y compris quand l'acompte ne se paie pas en ligne (mode manuel,
--    acompte désactivé, compte Stripe inactif). Pour celles-là, il n'y a pas
--    de paiement à attendre : la demande doit occuper le créneau jusqu'à la
--    décision du professionnel (docs/18 §5). Sans ce nettoyage, la première
--    passe d'expiration les annulerait toutes.
--
--    Les réservations des professionnels en paiement Stripe actif gardent leur
--    blocage : abandonnées, elles expireront normalement, et l'e-mail de
--    relance permet toujours au client de payer si le créneau est libre.
update public.detailer_bookings b
   set hold_expires_at = null
  from public.detailers d
 where b.detailer_id = d.id
   and b.status = 'en_attente_paiement'
   and b.hold_expires_at is not null
   and (
         d.payment_mode = 'manuel'
      or d.stripe_charges_enabled is not true
      or d.deposit_enabled is not true
      or coalesce(b.deposit_amount, 0) <= 0
   );
