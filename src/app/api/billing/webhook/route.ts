import { NextResponse } from 'next/server';
import { logServerEvent } from '@/lib/analytics-server';
import { verifyWebhookSignature } from '@/lib/billing/stripe';
import { resolveTransport } from '@/lib/email/transport';

/**
 * Webhook Stripe — abonnements Qualifyr.
 *
 * Endpoint distinct de `/api/detailing/stripe-webhook` (qui confirme les
 * acomptes clients sur les comptes Connect des professionnels) : à déclarer
 * séparément dans le tableau de bord Stripe, avec son propre secret de
 * signature (`STRIPE_BILLING_WEBHOOK_SECRET`), sur les événements
 * `checkout.session.completed`, `customer.subscription.updated`,
 * `customer.subscription.deleted` et, depuis le 22/08/2026,
 * `checkout.session.expired` (à cocher en plus dans le tableau de bord
 * Stripe pour que la relance de panier abandonné fonctionne — voir
 * `lib/billing/stripe.ts`).
 *
 * **Ce que cette route fait aujourd'hui.** Elle vérifie la signature (sans
 * quoi n'importe qui pourrait simuler un paiement), identifie l'abonnement,
 * le plan et la périodicité, journalise l'événement, et relance par e-mail
 * un paiement abandonné quand le client y a consenti.
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
      readonly customer_details?: {
        readonly email?: string;
      };
      readonly consent?: {
        readonly promotions?: string;
      };
      readonly after_expiration?: {
        readonly recovery?: {
          readonly url?: string;
        };
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
    'checkout.session.expired',
  ];

  if (!handled.includes(event.type)) {
    // Accepté sans traitement : renvoyer une erreur ferait réessayer Stripe
    // en boucle sur des événements qu'on a simplement choisi d'ignorer.
    return NextResponse.json({ received: true });
  }

  const object = event.data.object;
  const plan = object.metadata?.plan ?? 'inconnu';
  const cadence = object.metadata?.cadence ?? 'inconnue';

  if (event.type === 'checkout.session.expired') {
    // Relance de paiement abandonné (§3 de l'audit growth marketing).
    //
    // **Consentement d'abord.** Sans `consent.promotions === 'opt_in'`,
    // Stripe ne renvoie même pas l'e-mail du client dans cet événement — il
    // n'y a alors rien à faire, et c'est volontaire (RGPD, voir
    // `lib/billing/stripe.ts`).
    //
    // **Pas de déduplication en base.** Une session Stripe n'expire qu'une
    // fois : ce webhook ne devrait donc recevoir cet événement qu'une seule
    // fois par session, sauf rejeu réseau de Stripe lui-même (rare, et sans
    // conséquence grave si un même client reçoit deux fois le même lien).
    // Construire un magasin de déduplication pour ce seul cas n'a pas semblé
    // justifié tant qu'aucune table `subscriptions` n'existe déjà (voir
    // PROVISIONING plus bas) — à revoir si un abus est constaté.
    const email = object.customer_details?.email;
    const recoveryUrl = object.after_expiration?.recovery?.url;
    const consented = object.consent?.promotions === 'opt_in';

    if (email && recoveryUrl && consented) {
      const resolution = resolveTransport();
      if (resolution.status === 'ready') {
        const sent = await resolution.transport.send({
          to: email,
          from: resolution.from,
          subject: 'Vous n’avez pas terminé votre abonnement Qualifyr',
          text: [
            'Vous avez commencé à vous abonner à Qualifyr et le paiement ne s’est pas terminé.',
            '',
            `Reprendre où vous en étiez : ${recoveryUrl}`,
            '',
            'Ce lien reste valable 30 jours. Si vous avez changé d’avis, vous pouvez ignorer ce message.',
          ].join('\n'),
        });
        void logServerEvent({
          eventName: sent.ok ? 'checkout_recovery_email_sent' : 'checkout_recovery_email_failed',
          metadata: { plan, cadence },
        });
      }
    }

    return NextResponse.json({ received: true });
  }

  // `console.warn`, pas `console.info` : la règle de lint du projet n'autorise
  // que `warn`/`error` sur la console. Ce n'est pas une erreur — juste la
  // seule trace disponible tant que le provisioning (voir plus bas) n'écrit
  // nulle part ailleurs.
  console.warn(
    `[billing/webhook] ${event.type} — plan=${plan} cadence=${cadence} customer=${object.customer ?? 'n/a'} status=${object.status ?? 'n/a'}`,
  );

  // Journalisé indépendamment du provisioning (qui ne fait rien encore, voir
  // le commentaire PROVISIONING plus bas) : c'est ce qui permet de mesurer le
  // taux de conversion réel abonnement → paiement dès aujourd'hui, avant même
  // que l'accès /app ne soit branché.
  void logServerEvent({
    eventName: event.type === 'checkout.session.completed' ? 'payment_completed' : 'subscription_updated',
    metadata: { plan, cadence, status: object.status ?? null },
  });

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
