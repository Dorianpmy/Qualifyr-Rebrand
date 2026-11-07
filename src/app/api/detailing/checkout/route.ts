import { NextResponse } from 'next/server';
import { z } from 'zod';
import { detailerHasCapability } from '@/lib/billing/guard';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import { createDepositCheckout } from '@/lib/detailing/stripe';
import { CHECKOUT_HOLD_MINUTES, CHECKOUT_SESSION_MINUTES, holdUntil } from '@/lib/detailing/holds';
import { profileFor } from '@/lib/detailing/locale';

/**
 * Ouverture du paiement de l'acompte.
 *
 * Appelée juste après l'enregistrement de la réservation, qui part en
 * `en_attente_paiement`. Le client est redirigé vers une page hébergée par
 * Stripe ; il n'entre jamais ses coordonnées bancaires sur Qualifyr, ce qui
 * évite au projet toute obligation de conformité PCI.
 *
 * **Le montant n'est jamais lu depuis la requête.** Il est relu en base à
 * partir de l'identifiant de réservation. Une valeur transmise par le
 * navigateur se modifie dans la console : accepter un acompte envoyé par le
 * client, c'est accepter qu'il paie un euro.
 */

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  bookingId: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Base indisponible.' }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const { data: booking, error } = await supabase
    .from('detailer_bookings')
    .select('id, status, deposit_amount, email, detailer_id')
    .eq('id', parsed.data.bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 });
  }

  /*
   * Le droit d'encaisser appartient au professionnel, pas à l'appelant.
   *
   * Cette route est publique : c'est le client final qui l'appelle, sans
   * session. Le contrôle porte donc sur l'abonnement du propriétaire de la
   * fiche. Sans lui, un professionnel abonné « Agent seul » encaisserait des
   * acomptes qu'il n'a pas payés — il lui suffirait de faire réserver
   * quelqu'un sur sa page publique.
   *
   * Message neutre et 403 : un client final n'a pas à savoir dans quel
   * abonnement se trouve le professionnel.
   */
  const allowed = await detailerHasCapability(
    String(booking.detailer_id),
    'payments.deposit',
  );
  if (!allowed) {
    return NextResponse.json(
      { error: 'Le paiement en ligne n’est pas disponible pour ce professionnel.' },
      { status: 403 },
    );
  }

  // Une réservation déjà payée ou annulée ne doit pas rouvrir un paiement :
  // sans cette garde, un rafraîchissement de page encaisse deux fois.
  // `expire` est accepté : un client relancé par e-mail peut encore payer si
  // son créneau est libre (`docs/13` §2.5). Le blocage est reposé plus bas.
  if (booking.status !== 'en_attente_paiement' && booking.status !== 'expire') {
    return NextResponse.json(
      { error: 'Cette réservation n’attend pas de paiement.' },
      { status: 409 },
    );
  }

  const { data: detailer } = await supabase
    .from('detailers')
    .select('id, name, slug, country, stripe_account_id, stripe_charges_enabled')
    .eq('id', booking.detailer_id)
    .single();

  if (!detailer) {
    return NextResponse.json({ error: 'Professionnel introuvable.' }, { status: 404 });
  }

  /*
   * Le compte de paiement doit exister **et** accepter les paiements. Un
   * dossier Stripe créé mais incomplet renvoie un identifiant valide et refuse
   * toute transaction : tester la seule présence de l'identifiant enverrait le
   * client sur une page d'erreur après qu'il a choisi son créneau.
   */
  if (!detailer.stripe_account_id || !detailer.stripe_charges_enabled) {
    return NextResponse.json(
      {
        error: 'paiement_indisponible',
        message:
          'Ce professionnel n’a pas encore activé le paiement en ligne. Votre créneau est réservé, il vous recontacte pour le règlement.',
      },
      { status: 409 },
    );
  }

  /*
   * Le blocage suit la durée de vie de la session Stripe (trente minutes au
   * minimum, imposé par Stripe), plus une minute : le client ne peut jamais
   * payer un créneau déjà rendu. Pour une réservation expirée, la contrainte
   * d'exclusion refuse la remise en attente si quelqu'un a pris le créneau
   * entre-temps.
   */
  const sessionExpiresAt = new Date(Date.now() + CHECKOUT_SESSION_MINUTES * 60_000);
  const { data: held, error: holdError } = await supabase
    .from('detailer_bookings')
    .update({ status: 'en_attente_paiement', hold_expires_at: holdUntil(CHECKOUT_HOLD_MINUTES) })
    .eq('id', booking.id)
    .eq('status', booking.status)
    .select('id')
    .maybeSingle();

  if (holdError?.code === '23P01') {
    return NextResponse.json(
      {
        error: 'creneau_pris',
        message:
          'Ce créneau a été réservé par un autre client entre-temps. Reprenez une réservation pour en choisir un autre.',
      },
      { status: 409 },
    );
  }
  if (holdError || !held) {
    // Statut changé entre la lecture et l'écriture (paiement confirmé dans un
    // autre onglet, annulation par le professionnel) : on ne paie pas deux fois.
    return NextResponse.json(
      { error: 'Cette réservation n’attend plus de paiement.' },
      { status: 409 },
    );
  }

  const profile = profileFor(detailer.country as string);
  const origin = new URL(request.url).origin;

  try {
    const session = await createDepositCheckout({
      accountId: detailer.stripe_account_id as string,
      bookingId: booking.id as string,
      amount: Number(booking.deposit_amount),
      currency: profile.currency === 'CHF' ? 'chf' : 'eur',
      detailerName: detailer.name as string,
      clientEmail: booking.email as string,
      successUrl: `${origin}/reservation/${detailer.slug}/confirmation?booking=${booking.id}`,
      cancelUrl: `${origin}/reservation/${detailer.slug}?annule=1`,
      expiresAt: sessionExpiresAt,
    });

    return NextResponse.json({ url: session.url });
  } catch (cause) {
    /*
     * L'erreur détaillée reste côté serveur. Renvoyée au client, elle exposerait
     * la configuration du compte du professionnel à n'importe quel visiteur.
     */
    console.error('[checkout] échec de création de session', cause);
    return NextResponse.json(
      { error: 'Le paiement n’a pas pu être ouvert. Réessayez dans un instant.' },
      { status: 502 },
    );
  }
}
