import 'server-only';

/**
 * Stripe — abonnements Qualifyr (compte direct, pas Connect).
 *
 * **Différent de `lib/detailing/stripe.ts`.** Ce fichier-là fait payer le
 * client final *sur le compte du professionnel* (Connect Express) : Qualifyr
 * n'est jamais dépositaire de cet argent. Ici, c'est l'inverse — un laveur
 * auto s'abonne à Qualifyr, et l'argent va directement sur le compte Stripe
 * de Qualifyr. Les deux flux ne doivent jamais partager de code : mélanger
 * un appel avec `Stripe-Account` (Connect) et un appel sans (compte direct)
 * est la façon la plus rapide de faire arriver un abonnement chez un
 * detailer, ou un acompte client chez Qualifyr.
 *
 * **Même discipline que `lib/detailing/stripe.ts` : pas de SDK.** L'API REST
 * suffit pour les deux appels nécessaires (créer une session, vérifier un
 * webhook), et le paquet `stripe` n'apporte ici que du poids.
 */

const API = 'https://api.stripe.com/v1';

function secretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY manquante. Sans elle, aucun abonnement ne peut être proposé.',
    );
  }
  return key;
}

export type BillingPlan = 'agent' | 'complet' | 'systeme';
export type BillingCadence = 'monthly' | 'annual';

/**
 * Un identifiant de Price Stripe par offre et par périodicité — six au
 * total. Ce ne sont **pas** des montants recalculés ici : chaque Price est
 * créé une fois dans le tableau de bord Stripe (ou via l'API, en une seule
 * fois, hors de ce code) avec le bon montant et le bon intervalle de
 * facturation. Recalculer un prix côté serveur à chaque session serait aussi
 * fragile que dangereux — le jour où le prix change sur le site sans changer
 * dans Stripe, le client paie un montant différent de celui qu'il a vu.
 *
 * Variables d'environnement attendues, voir `.env.example` :
 * `STRIPE_PRICE_AGENT_MONTHLY`, `STRIPE_PRICE_AGENT_ANNUAL`,
 * `STRIPE_PRICE_COMPLET_MONTHLY`, `STRIPE_PRICE_COMPLET_ANNUAL`,
 * `STRIPE_PRICE_SYSTEME_MONTHLY`, `STRIPE_PRICE_SYSTEME_ANNUAL`.
 */
function priceEnvVar(plan: BillingPlan, cadence: BillingCadence): string {
  const planKey = { agent: 'AGENT', complet: 'COMPLET', systeme: 'SYSTEME' }[plan];
  const cadenceKey = cadence === 'annual' ? 'ANNUAL' : 'MONTHLY';
  return `STRIPE_PRICE_${planKey}_${cadenceKey}`;
}

export function resolvePriceId(plan: BillingPlan, cadence: BillingCadence): string {
  const envVar = priceEnvVar(plan, cadence);
  const priceId = process.env[envVar];
  if (!priceId) {
    throw new Error(
      `${envVar} manquante. Créez le Price correspondant dans Stripe puis renseignez son identifiant.`,
    );
  }
  return priceId;
}

/**
 * Session de paiement d'un abonnement.
 *
 * `mode: 'subscription'` et non `'payment'` : c'est un engagement récurrent,
 * pas un paiement unique — Stripe crée le client, l'abonnement et la
 * première facture en une fois.
 *
 * Pas d'en-tête `Stripe-Account` : la session se crée sur le compte Stripe
 * de Qualifyr lui-même.
 */
export async function createSubscriptionCheckout(input: {
  readonly plan: BillingPlan;
  readonly cadence: BillingCadence;
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly customerEmail?: string;
}): Promise<{ readonly id: string; readonly url: string }> {
  const priceId = resolvePriceId(input.plan, input.cadence);

  const body = new URLSearchParams({
    mode: 'subscription',
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    // Autorise le client à saisir un code promo sur la page Stripe plutôt
    // que d'avoir à en construire un dans ce code.
    allow_promotion_codes: 'true',
    // Le plan et la périodicité voyagent avec la session : c'est ce que le
    // webhook relit pour savoir quoi activer, sans dépendre de l'ordre
    // d'arrivée des événements ni d'un second appel à Stripe.
    'metadata[plan]': input.plan,
    'metadata[cadence]': input.cadence,
    'subscription_data[metadata][plan]': input.plan,
    'subscription_data[metadata][cadence]': input.cadence,
    ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
  }).toString();

  const response = await fetch(`${API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  });

  const payload = (await response.json()) as {
    id: string;
    url: string;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Stripe a répondu ${response.status}.`);
  }

  return { id: payload.id, url: payload.url };
}

/**
 * Vérifie la signature d'un webhook Stripe.
 *
 * Copie volontaire de `verifyWebhookSignature` dans `lib/detailing/stripe.ts`
 * plutôt qu'un import partagé : les deux vérifient des webhooks qui portent
 * des secrets de signature différents (deux endpoints distincts déclarés
 * séparément dans le tableau de bord Stripe), et le jour où l'un des deux
 * flux change de logique, ils ne doivent pas se tirer l'un l'autre.
 */
export async function verifyWebhookSignature(input: {
  readonly payload: string;
  readonly header: string | null;
  readonly secret: string;
  readonly toleranceSeconds?: number;
}): Promise<boolean> {
  if (!input.header) return false;

  const parts = Object.fromEntries(
    input.header.split(',').map((part) => {
      const [key, ...rest] = part.split('=');
      return [key?.trim() ?? '', rest.join('=')];
    }),
  );

  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > (input.toleranceSeconds ?? 300)) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(input.secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${input.payload}`),
  );

  const expected = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}
