import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/billing/stripe';

/**
 * Webhook Stripe — abonnements Qualifyr.
 *
 * Endpoint distinct de `/api/detailing/stripe-webhook` (qui confirme les
 * acomptes clients sur les comptes Connect des professionnels) : à déclarer
 * séparément dans le tableau de bord Stripe, avec son propre secret de
 * signature (`STRIPE_BILLING_WEBHOOK_SECRET`), sur les événements
 * `checkout.session.completed`, `customer.subscription.updated` et
 * `customer.subscription.deleted`.
 *
 * **Ce que cette route fait aujourd'hui.** Elle vérifie la signature (sans
 * quoi n'importe qui pourrait simuler un paiement), identifie l'abonnement,
 * le plan et la périodicité, et journalise l'événement.
 *
 * **Ce qu'elle ne fait pas encore, volontairement.** Activer l'accès du
 * client dans l'espace pro (`/app`) suppose de savoir où stocker « ce
 * compte a tel abonnement, actif jusqu'à telle date » — une table
 * `subscriptions`, une colonne sur `detailers`, autre chose : ce choix
 * touche au schéma d'authentification existant et ne doit pas être deviné
 * dans ce fichier. Tant que ce n'est pas branché, un abonnement payé est
 * bien créé et facturé côté Stripe, mais n'active rien automatiquement côté
 * Qualifyr — voir le commentaire `PROVISIONING` ci-dessous pour l'endroit
 * exact où ajouter cette logique une fois le modèle de données choisi.
 */

export const dynamic = 'force-dynamic';

type StripeEvent = {
  readonly type: string;
  readonly data: {
    readonly object: {
      readonly id: string;
      readonly customer?: string;
      readonly customer_email?: string;
      readonly status?: string;
      readonly metadata?: {
        readonly plan?: string;
        readonly cadence?: string;
      };
    };
  };
};

export async function POST(request: Request) {
  const secret = process.env.STRIPE_BILLING_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[billing/webhook] STRIPE_BILLING_WEBHOOK_SECRET manquante');
    return NextResponse.json({ error: 'Non configuré.' }, { status: 503 });
  }

  // Corps lu en texte brut : la signature porte sur les octets exacts envoyés
  // par Stripe, pas sur une re-sérialisation JSON.
  const payload = await request.text();

  const valid = await verifyWebhookSignature({
    payload,
    header: request.headers.get('stripe-signature'),
    secret,
  });

  if (!valid) {
    // 400 et non 401 : Stripe réessaie sur 5xx, jamais sur 4xx. Une signature
    // invalide ne deviendra pas valide en réessayant.
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;

  const handled = [
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
  ];

  if (!handled.includes(event.type)) {
    // Accepté sans traitement : renvoyer une erreur ferait réessayer Stripe
    // en boucle sur des événements qu'on a simplement choisi d'ignorer.
    return NextResponse.json({ received: true });
  }

  const object = event.data.object;
  const plan = object.metadata?.plan ?? 'inconnu';
  const cadence = object.metadata?.cadence ?? 'inconnue';

  // `console.warn`, pas `console.info` : la règle de lint du projet n'autorise
  // que `warn`/`error` sur la console. Ce n'est pas une erreur — juste la
  // seule trace disponible tant que le provisioning (voir plus bas) n'écrit
  // nulle part ailleurs.
  console.warn(
    `[billing/webhook] ${event.type} — plan=${plan} cadence=${cadence} customer=${object.customer ?? 'n/a'} status=${object.status ?? 'n/a'}`,
  );

  /*
   * PROVISIONING — à compléter une fois le modèle de données choisi.
   *
   * Ici, et seulement ici, doit vivre la logique qui :
   *  1. retrouve ou crée le compte Qualifyr associé à `object.customer`
   *     (ou `object.customer_email` sur `checkout.session.completed`) ;
   *  2. enregistre le plan actif et sa périodicité ;
   *  3. sur `customer.subscription.deleted`, révoque l'accès plutôt que de
   *     supprimer l'historique — un abonnement résilié doit rester
   *     consultable, pas disparaître.
   *
   * Idempotence : Stripe garantit « au moins une fois », pas « exactement
   * une fois » — le même événement peut arriver deux fois. Toute écriture
   * ajoutée ici doit pouvoir être rejouée sans effet de bord (ex. un
   * `upsert` sur l'identifiant Stripe, pas un `insert`).
   */

  return NextResponse.json({ received: true });
}
