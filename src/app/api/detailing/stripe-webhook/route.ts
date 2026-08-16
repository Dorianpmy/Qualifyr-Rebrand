import { NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import { verifyWebhookSignature } from '@/lib/detailing/stripe';

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
 */

export const dynamic = 'force-dynamic';

type CheckoutSession = {
  readonly id: string;
  readonly payment_intent?: string;
  readonly metadata?: { readonly booking_id?: string };
};

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

  const event = JSON.parse(payload) as {
    type: string;
    data: { object: CheckoutSession };
  };

  // Les autres types d'événements sont acceptés sans traitement : renvoyer une
  // erreur ferait réessayer Stripe en boucle sur des événements qu'on a
  // simplement choisi d'ignorer.
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const bookingId = session.metadata?.booking_id;

  if (!bookingId) {
    console.error('[webhook] session sans booking_id', session.id);
    return NextResponse.json({ received: true });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    // 503 : Stripe réessaiera, et la réservation finira par être confirmée.
    return NextResponse.json({ error: 'Base indisponible.' }, { status: 503 });
  }

  /*
   * La condition sur le statut rend l'opération idempotente. Stripe garantit
   * « au moins une fois », pas « exactement une fois » : le même événement
   * arrive parfois deux fois. Sans cette garde, un rejeu écraserait un statut
   * modifié entre-temps — une réservation annulée par le professionnel
   * redeviendrait confirmée.
   */
  const { error } = await supabase
    .from('detailer_bookings')
    .update({
      status: 'confirme',
      deposit_paid_at: new Date().toISOString(),
      stripe_payment_intent_id: session.payment_intent ?? null,
      // Le créneau n'expire plus : il est payé.
      hold_expires_at: null,
    })
    .eq('id', bookingId)
    .eq('status', 'en_attente_paiement');

  if (error) {
    console.error('[webhook] confirmation impossible', bookingId, error);
    // 500 pour que Stripe réessaie : l'argent est encaissé, la réservation
    // doit finir par être confirmée.
    return NextResponse.json({ error: 'Mise à jour impossible.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
