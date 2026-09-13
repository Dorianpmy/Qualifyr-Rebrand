-- Numéro WhatsApp affiché au client pendant sa réservation.
--
-- Jusqu'ici, la bulle WhatsApp flottante (`WhatsAppBadge`) était câblée en
-- dur sur le numéro de support Qualifyr sur *toutes* les pages, y compris
-- `/reservation/[slug]` et `/embed/[slug]` — un client d'un professionnel qui
-- cliquait dessus pendant sa réservation écrivait donc à Qualifyr au lieu
-- d'écrire au professionnel qu'il était en train de réserver.
--
-- Colonne libre (comme `iban`) : aucun format n'est imposé en base, la
-- validation se fait à l'affichage (`lib/whatsapp.ts`, `buildWhatsAppUrl`) —
-- un numéro mal formé fait simplement disparaître le bouton plutôt que de
-- planter la page. Tant qu'elle est vide, le numéro de support Qualifyr sert
-- de repli (voir `reservation/[slug]/page.tsx` et `embed/[slug]/page.tsx`).
alter table detailers
  add column if not exists whatsapp_number text;

comment on column detailers.whatsapp_number is
  'Numéro WhatsApp affiché aux clients pendant la réservation. Vide = repli sur le numéro de support Qualifyr.';
