import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import { refundDeposit, verifyWebhookSignature } from '@/lib/detailing/stripe';
import { classifyDepositEvent } from '@/lib/detailing/stripe-events';

/**
 * Webhook Stripe — c'est lui qui confirme la réservation, pas le navigateur.
 *
 * **Pourquoi ne pas confirmer au retour du client.** La page de succès ne se
 * charge pas toujours : le client ferme l'onglet, perd le réseau dans un
 * parking, ou revient en arrière. Le paiement a pourtant eu lieu. Confirmer
 * côté navigateur, c'est encaisser sans bloquer le créneau — et le
 * professionnel découvre le trou le jour même.
 *
 * **La signature est vérifiée avant toute lecture du contenu.** Sans elle,
 * n'importe qui peut confirmer n'importe quelle réservation en envoyant une
 * requête à cette adresse.
 *
 * **Le corps est lu en texte brut.** La signature porte sur les octets exacts
 * envoyés par Stripe ; passer par `request.json()` puis re-sérialiser change
 * l'ordre des clés et invalide la vérification.
 *
 * **Endpoint Connect (07/11/2026).** Les acomptes sont encaissés sur le compte
 * du professionnel : leurs événements naissent sur son compte et ne sont
 * envoyés qu'à un endpoint déclaré « Connect ». Chaque événement porte
 * `account`, qui doit correspondre au `stripe_account_id` du professionnel de
 * la réservation — sinon il est ignoré (`docs/13` §2.5, tableau des
 * événements traités).
 */

export const dynamic = 'force-dynamic';

const EXCLUSION_VIOLATION = '23P01';

/** Réponse « reçu » : Stripe ne réessaie pas, rien n'est à refaire. */
function received(note?: string) {
  return NextResponse.json(note ? { received: true, note } : { received: true });
}

/**
 * La réservation appartient-elle au professionnel de ce compte connecté ?
 *
 * Sans cette vérification, un professionnel pourrait, depuis son propre compte
 * Stripe, envoyer un paiement portant l'identifiant de réservation d'un autre
 * et la faire confirmer.
 */
async function bookingBelongsToAccount(
  supabase: SupabaseClient,
  bookingId: string,
  account: string,
): Promise<boolean> {
  const { data: booking } = await supabase
    .from('detailer_bookings')
    .select('detailer_id')
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking) return false;

  const { data: detailer } = await supabase
    .from('detailers')
    .select('stripe_account_id')
    .eq('id', booking.detailer_id)
    .maybeSingle();

  return detailer?.stripe_account_id === account;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET manquante');
    return NextResponse.json({ error: 'Non configuré.' }, { status: 503 });
  }

  const payload = await request.text();

  const valid = await verifyWebhookSignature({
    payload,
    header: request.headers.get('stripe-signature'),
    secret,
  });

  if (!valid) {
    // 400 et non 401 : Stripe réessaie sur 5xx, pas sur 4xx. Une signature
    // invalide ne deviendra jamais valide, inutile de faire réessayer.
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: 'Corps illisible.' }, { status: 400 });
  }

  // Les événements ignorés sont acquittés sans traitement : renvoyer une
  // erreur ferait réessayer Stripe en boucle sur des événements qu'on a
  // simplement choisi de ne pas traiter.
  const action = classifyDepositEvent(parsed);
  if (action.kind === 'ignore') return received(action.reason);

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    // 503 : Stripe réessaiera, et la réservation finira par être traitée.
    return NextResponse.json({ error: 'Base indisponible.' }, { status: 503 });
  }

  if (action.kind === 'sync_account') {
    const { error } = await supabase
      .from('detailers')
      .update({ stripe_charges_enabled: action.chargesEnabled })
      .eq('stripe_account_id', action.account);
    if (error) {
      console.error('[webhook] synchronisation du compte impossible', action.account, error);
      return NextResponse.json({ error: 'Mise à jour impossible.' }, { status: 500 });
    }
    return received();
  }

  if (!(await bookingBelongsToAccount(supabase, action.bookingId, action.account))) {
    console.error('[webhook] compte connecté sans rapport avec la réservation', action.bookingId);
    return received('compte_non_concordant');
  }

  if (action.kind === 'expire') {
    // Stripe a abandonné la session : le créneau est rendu tout de suite,
    // sans attendre la tâche planifiée. Une réservation déjà payée ou
    // modifiée par le professionnel n'est pas touchée.
    const { error } = await supabase
      .from('detailer_bookings')
      .update({ status: 'expire' })
      .eq('id', action.bookingId)
      .eq('status', 'en_attente_paiement');
    if (error) {
      console.error('[webhook] expiration impossible', action.bookingId, error);
      return NextResponse.json({ error: 'Mise à jour impossible.' }, { status: 500 });
    }
    return received();
  }

  /*
   * Confirmation. La condition sur le statut rend l'opération idempotente.
   * Stripe garantit « au moins une fois », pas « exactement une fois » : le
   * même événement arrive parfois deux fois. Sans cette garde, un rejeu
   * écraserait un statut modifié entre-temps — une réservation annulée par le
   * professionnel redeviendrait confirmée.
   *
   * `expire` est accepté : le webhook peut arriver après le passage de la
   * tâche d'expiration. Si le créneau a été repris entre-temps, la contrainte
   * d'exclusion refuse la mise à jour (23P01) et l'acompte est remboursé.
   */
  const { error } = await supabase
    .from('detailer_bookings')
    .update({
      status: 'confirme',
      deposit_paid_at: new Date().toISOString(),
      stripe_payment_intent_id: action.paymentIntentId,
      // Le créneau n'expire plus : il est payé.
      hold_expires_at: null,
    })
    .eq('id', action.bookingId)
    .in('status', ['en_attente_paiement', 'expire']);

  if (error?.code === EXCLUSION_VIOLATION) {
    if (!action.paymentIntentId) {
      console.error('[webhook] créneau repris, paiement sans identifiant', action.bookingId);
      return received('creneau_repris_sans_paiement');
    }
    try {
      await refundDeposit({ accountId: action.account, paymentIntentId: action.paymentIntentId });
      console.error('[webhook] créneau repris, acompte remboursé', action.bookingId);
      return received('creneau_repris_rembourse');
    } catch (cause) {
      // 500 : Stripe réessaiera, et la clé d'idempotence empêche un double
      // remboursement.
      console.error('[webhook] créneau repris, remboursement impossible', action.bookingId, cause);
      return NextResponse.json({ error: 'Remboursement impossible.' }, { status: 500 });
    }
  }

  if (error) {
    console.error('[webhook] confirmation impossible', action.bookingId, error);
    // 500 pour que Stripe réessaie : l'argent est encaissé, la réservation
    // doit finir par être confirmée.
    return NextResponse.json({ error: 'Mise à jour impossible.' }, { status: 500 });
  }

  return received();
}
