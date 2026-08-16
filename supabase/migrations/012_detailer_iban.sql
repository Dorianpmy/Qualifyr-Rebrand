-- IBAN du professionnel, pour la QR-facture suisse.
--
-- Stripe Connect collecte déjà un IBAN pour verser les acomptes, mais ne le
-- restitue pas en clair (sécurité) : impossible de le réutiliser pour générer
-- un QR-bill. Ce champ est saisi une fois dans les réglages, séparément du
-- compte de paiement Stripe.

ALTER TABLE detailers
  ADD COLUMN IF NOT EXISTS iban text;
