import { NextResponse } from 'next/server';
import { createBillingPortalSession } from '@/lib/billing/stripe';
import { getSessionUser } from '@/lib/detailing/session';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';

/**
 * Ouvre le portail de facturation Stripe pour le professionnel connecté.
 *
 * **L'identifiant client Stripe n'est jamais accepté depuis la requête.** Il
 * est relu en base à partir de la session : le transmettre depuis le
 * navigateur permettrait d'ouvrir le portail — donc les factures, les moyens
 * de paiement et la résiliation — de n'importe quel client dont on
 * devinerait l'identifiant.
 *
 * **Aucune capacité n'est exigée.** Cet écran doit rester joignable
 * précisément quand l'abonnement va mal : un impayé ou une résiliation en
 * cours est le moment où le client a le plus besoin d'accéder à sa
 * facturation. Le fermer pour défaut de paiement enfermerait dehors la
 * personne venue payer.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Session expirée.' }, { status: 401 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: 'Base indisponible.' }, { status: 503 });
  }

  /*
   * La ligne la plus récente qui porte un identifiant client : après un
   * changement d'offre, l'ancien abonnement est passé en `canceled` mais son
   * `stripe_customer_id` reste valable — c'est le même client chez Stripe.
   */
  const { data, error } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('owner_id', user.id)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, message: 'Lecture impossible.' }, { status: 500 });
  }

  const customerId = (data as { stripe_customer_id: string } | null)?.stripe_customer_id;
  if (!customerId) {
    /*
     * Cas réel, pas théorique : un compte provisionné à la main pour un test
     * n'a aucune référence Stripe. Le dire franchement vaut mieux qu'un
     * portail vide ou qu'une erreur technique.
     */
    return NextResponse.json(
      {
        ok: false,
        message:
          'Aucun abonnement payant n’est rattaché à ce compte. Choisissez une offre pour en créer un.',
      },
      { status: 404 },
    );
  }

  try {
    const origin = new URL(request.url).origin;
    const session = await createBillingPortalSession({
      customerId,
      returnUrl: `${origin}/app/abonnement`,
    });
    return NextResponse.json({ ok: true, url: session.url });
  } catch (cause) {
    console.error('[billing/portal] ouverture impossible', cause);
    return NextResponse.json(
      { ok: false, message: 'Le portail n’a pas pu s’ouvrir. Réessayez dans un instant.' },
      { status: 502 },
    );
  }
}
