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
    // Relance des paiements abandonnés (tentée le 22/08/2026, phase 3 de
    // l'audit growth marketing) : retirée le même jour. `consent_collection
    // [promotions]` n'est pas disponible pour un compte Stripe déclaré en
    // France — Stripe rejetait alors CHAQUE création de session avec
    // « `consent_collection.promotions` is not available in your country »,
    // cassant tous les abonnements, pas seulement la relance. Le webhook
    // (`billing/webhook/route.ts`) garde son traitement de
    // `checkout.session.expired` par prudence, mais `object.consent` n'étant
    // plus jamais renseigné, `consented` y est toujours faux : aucun e-mail
    // de relance ne part. À réintroduire uniquement si Stripe ouvre ce
    // paramètre aux comptes FR, ou via un mécanisme de consentement propre
    // ne dépendant pas de `consent_collection`.
    // Le plan et la périodicité voyagent avec la session : c'est ce que le
    // webhook relit pour savoir quoi activer, sans dépendre de l'ordre
    // d'arrivée des événements ni d'un second appel à Stripe.
    'metadata[plan]': input.plan,
    'metadata[cadence]': input.cadence,
    'subscription_data[metadata][plan]': input.plan,
    'subscription_data[metadata][cadence]': input.cadence,
    // Collecte de facturation (22/08/2026, étape 2 du plan de test —
    // `docs/10-rapport-final-facturation-electronique.md`). Absente jusqu'ici :
    // aucune facture ne pouvait porter l'adresse, le SIRET ou le numéro de TVA
    // du client, des mentions obligatoires pour une facture française conforme
    // (voir `docs/08...`, point C). Contrairement à `consent_collection
    // [promotions]` (retiré plus haut — paramètre indisponible pour un compte
    // Stripe déclaré en France), `billing_address_collection` et
    // `tax_id_collection` sont des paramètres standards, disponibles pour tous
    // les comptes ; **non vérifié en direct depuis cet environnement, qui n'a
    // pas de clé Stripe de test** — à confirmer par une session Checkout de
    // test réelle avant tout déploiement (étape 3 du plan de test).
    billing_address_collection: 'required',
    'tax_id_collection[enabled]': 'true',
    // Raison sociale : un champ personnalisé, facultatif. Le nom/prénom sur la
    // carte bancaire ne suffit pas à identifier une entreprise cliente sur une
    // facture B2B.
    'custom_fields[0][key]': 'company_name',
    'custom_fields[0][label][type]': 'custom',
    'custom_fields[0][label][custom]': 'Raison sociale (si professionnel)',
    'custom_fields[0][type]': 'text',
    'custom_fields[0][optional]': 'true',
    /*
     * Essai de quatorze jours (24/08/2026).
     *
     * **Il rattrape une promesse qui existait déjà sans support technique.**
     * `OfferConfigurator` annonçait « 14 jours d'essai gratuit inclus par
     * défaut », et le contenu GEO parlait d'un essai gratuit, alors qu'aucune
     * période d'essai n'était configurée : le Checkout prélevait
     * immédiatement. Le paramètre existait donc dans le discours commercial,
     * pas dans le code.
     *
     * **La carte reste demandée pendant l'essai, et ce n'est pas un oubli.**
     * Stripe sait ouvrir un essai sans moyen de paiement
     * (`payment_method_collection: 'if_required'`), mais l'abonnement s'arrête
     * alors de lui-même au quatorzième jour, sans reconduction : il faudrait
     * relancer chaque compte à la main. La carte est donc collectée, non
     * débitée, et le professionnel peut résilier depuis son espace avant la
     * fin. Aucun texte du site ne doit écrire « sans carte bancaire » à propos
     * de cet essai — c'est l'analyse d'une première zone qui est sans carte,
     * pas l'abonnement.
     *
     * Changer ce nombre suppose de changer aussi les mentions de
     * `OfferConfigurator`, `content/geo.ts` et les CGV : trois endroits qui
     * annoncent la même durée à un client.
     */
    'subscription_data[trial_period_days]': '14',
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
 * Ouvre le portail client Stripe.
 *
 * **Il règle un problème que le Checkout ne peut pas résoudre : le changement
 * d'offre.** Un abonné à l'Agent qui passe au Pack complet en repassant par
 * `/tarifs` crée un **second** abonnement Stripe. Ses droits s'ouvrent bien —
 * le webhook clôture le précédent en base — mais Stripe, lui, garde les deux
 * actifs et prélève 17 € **et** 59 €. Le client paie deux fois, et rien de ce
 * côté-ci ne le signale, puisque la base ne connaît qu'un abonnement vivant.
 *
 * Depuis le portail, Stripe modifie l'abonnement existant au lieu d'en créer
 * un autre, et calcule le prorata : le client ne paie que la différence pour
 * la période en cours. C'est le comportement qu'attend n'importe qui ayant
 * déjà changé de forfait ailleurs.
 *
 * **Le portail gère aussi ce qu'on n'a pas écrit** : changement de carte,
 * téléchargement des factures, résiliation. Les développer à la main
 * reviendrait à réécrire moins bien ce que Stripe maintient déjà.
 *
 * **Il faut l'activer dans le tableau de bord Stripe** (Paramètres →
 * Facturation → Portail client) et y autoriser explicitement le changement
 * d'offre, en y déclarant les six Prices. Sans cette configuration, le
 * portail s'ouvre mais ne propose que la résiliation — l'API ne peut pas la
 * suppléer.
 */
export async function createBillingPortalSession(input: {
  readonly customerId: string;
  readonly returnUrl: string;
}): Promise<{ readonly url: string }> {
  const body = new URLSearchParams({
    customer: input.customerId,
    return_url: input.returnUrl,
  }).toString();

  const response = await fetch(`${API}/billing_portal/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  });

  const payload = (await response.json()) as {
    url?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.url) {
    throw new Error(payload.error?.message ?? `Stripe a répondu ${response.status}.`);
  }

  return { url: payload.url };
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
