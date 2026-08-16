import 'server-only';
import { formatSlot } from './dashboard';
import { formatMoney, profileFor } from './locale';
import { getServiceSupabaseClient } from './supabase-server';

/**
 * Lecture publique d'une réservation — pour l'écran de paiement/confirmation.
 *
 * **Pas d'authentification : l'UUID de la réservation en tient lieu.** Le lien
 * part par e-mail (confirmation Stripe, relance de devis abandonné) ; personne
 * ne devine un UUID. Seuls les champs nécessaires à cet écran sont exposés —
 * jamais l'e-mail ou le téléphone du client, qu'un tiers qui obtiendrait
 * l'identifiant par un autre biais ne doit pas pouvoir lire.
 */

export type PublicBookingSummary = {
  readonly id: string;
  readonly status: string;
  readonly quotedPrice: number;
  readonly depositAmount: number;
  readonly quotedPriceLabel: string;
  readonly depositLabel: string;
  readonly detailerName: string;
  readonly detailerSlug: string;
  readonly paymentAvailable: boolean;
  /**
   * De quoi composer les consignes après paiement : où et quand le
   * professionnel intervient, et la consigne d'accès que le client a
   * lui-même renseignée — la lui répéter ici confirme qu'elle a bien été
   * prise en compte, plutôt que de le laisser se demander si elle s'est
   * perdue entre le formulaire et la réservation.
   */
  readonly locationMode: string;
  readonly slotLabel: string | null;
  readonly accessNote: string | null;
  readonly freeCancellationHours: number;
};

export async function getPublicBookingSummary(
  bookingId: string,
  slug: string,
): Promise<PublicBookingSummary | null> {
  const client = getServiceSupabaseClient();
  if (!client) return null;

  const { data: booking } = await client
    .from('detailer_bookings')
    .select('id, status, quoted_price, deposit_amount, detailer_id, location_mode, slot, access_note')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) return null;

  const { data: detailer } = await client
    .from('detailers')
    .select('id, name, slug, country, stripe_charges_enabled, free_cancellation_hours')
    .eq('id', booking.detailer_id)
    .maybeSingle();

  // La page vit sous /reservation/[slug] : un identifiant valide servi sous le
  // mauvais slug ne doit rien révéler de plus qu'une page introuvable.
  if (!detailer || detailer.slug !== slug) return null;

  const profile = profileFor(detailer.country as string);
  const quotedPrice = Number(booking.quoted_price);
  const depositAmount = Number(booking.deposit_amount);

  return {
    id: booking.id as string,
    status: booking.status as string,
    quotedPrice,
    depositAmount,
    quotedPriceLabel: formatMoney(quotedPrice, profile),
    depositLabel: formatMoney(depositAmount, profile),
    detailerName: detailer.name as string,
    detailerSlug: detailer.slug as string,
    paymentAvailable: Boolean(detailer.stripe_charges_enabled),
    locationMode: String(booking.location_mode ?? 'atelier'),
    slotLabel: booking.slot ? formatSlot(booking.slot as string) : null,
    accessNote: (booking.access_note as string | null) ?? null,
    freeCancellationHours: Number(detailer.free_cancellation_hours ?? 24),
  };
}
