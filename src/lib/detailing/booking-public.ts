import 'server-only';
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
};

export async function getPublicBookingSummary(
  bookingId: string,
  slug: string,
): Promise<PublicBookingSummary | null> {
  const client = getServiceSupabaseClient();
  if (!client) return null;

  const { data: booking } = await client
    .from('detailer_bookings')
    .select('id, status, quoted_price, deposit_amount, detailer_id')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) return null;

  const { data: detailer } = await client
    .from('detailers')
    .select('id, name, slug, country, stripe_charges_enabled')
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
  };
}
