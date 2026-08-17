import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSubscriptionCheckout } from '@/lib/billing/stripe';

/**
 * Ouverture d'un abonnement Qualifyr.
 *
 * Appelée par `SubscribeButton` depuis les cartes de tarifs (accueil,
 * `/nettoyage-automobile`, `/tarifs`). Le prospect n'entre jamais sa carte
 * sur Qualifyr : il est redirigé vers une page hébergée par Stripe, ce qui
 * évite toute obligation de conformité PCI de notre côté.
 *
 * Le prix n'est jamais recalculé ici à partir d'un montant transmis par le
 * navigateur — seul un identifiant de plan/périodicité est reçu, résolu vers
 * un Price Stripe fixé dans le tableau de bord Stripe. Un visiteur qui
 * modifierait la requête ne peut donc pas payer un montant différent de
 * celui affiché.
 */

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  plan: z.enum(['agent', 'complet', 'systeme']),
  cadence: z.enum(['monthly', 'annual']),
  // Facultatif : pré-remplit l'e-mail sur la page Stripe si on le connaît déjà
  // (ex. un prospect déjà identifié par le tunnel de démo). Jamais obligatoire
  // — Stripe le demande de toute façon si absent.
  email: z.string().email().optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const origin = new URL(request.url).origin;

  try {
    const session = await createSubscriptionCheckout({
      plan: parsed.data.plan,
      cadence: parsed.data.cadence,
      // Retour dans l'espace pro : c'est là que l'abonnement fraîchement payé
      // doit être configuré (zone, formules) — pas une page de remerciement
      // isolée qui ne mène nulle part ensuite.
      successUrl: `${origin}/app?abonnement=confirme`,
      cancelUrl: `${origin}/tarifs?abonnement=annule`,
      ...(parsed.data.email ? { customerEmail: parsed.data.email } : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (cause) {
    // Le détail (ex. "STRIPE_PRICE_AGENT_MONTHLY manquante") reste côté
    // serveur : utile dans les logs de déploiement, jamais montré au visiteur.
    console.error('[billing/checkout] échec de création de session', cause);
    return NextResponse.json(
      { error: 'Le paiement n’a pas pu être ouvert. Réessayez dans un instant.' },
      { status: 502 },
    );
  }
}
