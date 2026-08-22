import {
  intervalFromStripe,
  planFromStripe,
  statusFromStripe,
  type BillingInterval,
  type Plan,
  type SubscriptionStatus,
} from './plans';

/**
 * Traduction d'un événement Stripe en ligne d'abonnement.
 *
 * **Volontairement sans effet de bord.** Aucun accès à la base, aucun réseau :
 * cette fonction ne fait que lire un objet Stripe et décider ce qu'il faudrait
 * écrire. C'est ce qui rend testable la partie la plus délicate du
 * provisioning — la reconnaissance du plan, l'idempotence, le refus quand le
 * propriétaire est introuvable — sans monter d'environnement.
 *
 * L'écriture elle-même vit dans `api/billing/webhook/route.ts`.
 */

/** Forme minimale d'un objet Stripe, telle que ce projet la consomme. */
export type StripeSubscriptionLike = {
  readonly id?: string;
  readonly customer?: string;
  readonly status?: string;
  readonly cancel_at_period_end?: boolean;
  readonly current_period_start?: number;
  readonly current_period_end?: number;
  readonly trial_end?: number;
  readonly metadata?: Record<string, string | undefined>;
  readonly items?: {
    readonly data?: readonly {
      readonly price?: { readonly id?: string; readonly recurring?: { readonly interval?: string } };
    }[];
  };
  /** Présent sur `checkout.session.completed`. */
  readonly subscription?: string;
  readonly customer_email?: string;
  readonly customer_details?: { readonly email?: string };
};

export type SubscriptionRow = {
  readonly stripe_customer_id: string | null;
  readonly stripe_subscription_id: string | null;
  readonly stripe_price_id: string | null;
  readonly plan: Plan;
  readonly billing_interval: BillingInterval;
  readonly status: SubscriptionStatus;
  readonly current_period_start: string | null;
  readonly current_period_end: string | null;
  readonly trial_ends_at: string | null;
  readonly cancel_at_period_end: boolean;
};

/** Horodatage Stripe (secondes) → ISO, ou `null`. */
function toIso(seconds: unknown): string | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(seconds * 1000).toISOString();
}

/** L'e-mail auquel rattacher l'abonnement, selon la forme de l'événement. */
export function emailFromEvent(object: StripeSubscriptionLike): string | null {
  const email = object.customer_details?.email ?? object.customer_email ?? null;
  if (typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * L'identifiant d'abonnement Stripe, quelle que soit la forme de l'événement.
 *
 * Sur `customer.subscription.*` c'est `id` ; sur `checkout.session.completed`
 * c'est `subscription`, `id` désignant alors la session. Confondre les deux
 * créerait deux lignes pour un même abonnement — précisément ce que l'index
 * unique de la migration 015 doit empêcher.
 */
export function subscriptionIdFromEvent(
  eventType: string,
  object: StripeSubscriptionLike,
): string | null {
  if (eventType.startsWith('checkout.session.')) {
    return typeof object.subscription === 'string' ? object.subscription : null;
  }
  return typeof object.id === 'string' ? object.id : null;
}

/**
 * Construit la ligne à écrire, ou explique pourquoi c'est impossible.
 *
 * **Le plan ne se devine pas.** S'il est absent des métadonnées et illisible
 * depuis le prix, la fonction refuse. Choisir un plan par défaut serait la
 * faille la plus coûteuse du système : une métadonnée oubliée accorderait le
 * Pack complet à quelqu'un qui a payé l'Agent seul, ou l'inverse.
 */
export type ProvisioningPlan =
  | { readonly ok: true; readonly row: SubscriptionRow }
  | { readonly ok: false; readonly reason: 'unknown-plan' | 'missing-subscription-id' };

export function buildSubscriptionRow(input: {
  readonly eventType: string;
  readonly object: StripeSubscriptionLike;
  /** Correspondance identifiant de prix → plan, depuis les variables d'env. */
  readonly planByPriceId?: Readonly<Record<string, Plan>>;
}): ProvisioningPlan {
  const { eventType, object } = input;

  const subscriptionId = subscriptionIdFromEvent(eventType, object);
  if (!subscriptionId) return { ok: false, reason: 'missing-subscription-id' };

  const priceId = object.items?.data?.[0]?.price?.id ?? null;

  // Le plan vient d'abord des métadonnées (posées à la création de la session
  // par `createSubscriptionCheckout`), puis, à défaut, de l'identifiant de
  // prix — utile pour un abonnement créé directement dans le tableau de bord
  // Stripe, sans métadonnée.
  const plan =
    planFromStripe(object.metadata?.plan) ??
    (priceId ? (input.planByPriceId?.[priceId] ?? null) : null);

  if (!plan) return { ok: false, reason: 'unknown-plan' };

  const interval =
    object.items?.data?.[0]?.price?.recurring?.interval ?? object.metadata?.cadence;

  return {
    ok: true,
    row: {
      stripe_customer_id: typeof object.customer === 'string' ? object.customer : null,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      plan,
      billing_interval: intervalFromStripe(interval),
      // `checkout.session.completed` ne porte pas de statut d'abonnement :
      // la session est complète, l'abonnement est actif. Les événements
      // `customer.subscription.*` portent le vrai statut.
      status: eventType === 'checkout.session.completed'
        ? statusFromStripe(object.status ?? 'active')
        : statusFromStripe(object.status),
      current_period_start: toIso(object.current_period_start),
      current_period_end: toIso(object.current_period_end),
      trial_ends_at: toIso(object.trial_end),
      cancel_at_period_end: object.cancel_at_period_end === true,
    },
  };
}

/**
 * Correspondance identifiant de prix Stripe → plan, lue depuis les variables
 * d'environnement. Filet de sécurité quand les métadonnées manquent.
 */
export function planByPriceIdFromEnv(
  env: Readonly<Record<string, string | undefined>>,
): Readonly<Record<string, Plan>> {
  const pairs: readonly (readonly [string | undefined, Plan])[] = [
    [env['STRIPE_PRICE_AGENT_MONTHLY'], 'agent'],
    [env['STRIPE_PRICE_AGENT_ANNUAL'], 'agent'],
    [env['STRIPE_PRICE_SYSTEME_MONTHLY'], 'system'],
    [env['STRIPE_PRICE_SYSTEME_ANNUAL'], 'system'],
    [env['STRIPE_PRICE_COMPLET_MONTHLY'], 'complete'],
    [env['STRIPE_PRICE_COMPLET_ANNUAL'], 'complete'],
  ];

  const map: Record<string, Plan> = {};
  for (const [priceId, plan] of pairs) {
    if (priceId) map[priceId] = plan;
  }
  return map;
}
