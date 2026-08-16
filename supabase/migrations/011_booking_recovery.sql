-- ---------------------------------------------------------------------------
-- Relance des devis abandonnés.
--
-- Une réservation dont le délai de blocage (`hold_expires_at`) est dépassé
-- sans paiement reste en `en_attente_paiement` indéfiniment : rien ne la fait
-- expirer aujourd'hui (voir `booking.ts`). Cette colonne trace la relance
-- envoyée, sur le même modèle que `review_requested_at` (migration 009) : un
-- timestamp nul veut dire « à traiter », posé une fois pour ne jamais relancer
-- deux fois la même réservation.
-- ---------------------------------------------------------------------------

alter table public.detailer_bookings
  add column if not exists abandon_reminder_sent_at timestamptz;

-- La file de relance : réservations en attente de paiement, créneau expiré,
-- jamais relancées. Index partiel — la grande majorité des lignes ne
-- correspond à aucun de ces trois critères une fois payées ou déjà relancées.
create index if not exists detailer_bookings_abandon_pending_idx
  on public.detailer_bookings (hold_expires_at)
  where status = 'en_attente_paiement' and abandon_reminder_sent_at is null;
