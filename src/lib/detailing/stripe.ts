import 'server-only';

/**
 * Stripe Connect Express — l'acompte va directement chez le professionnel.
 *
 * **Pourquoi Connect et pas un compte Stripe classique.** Avec un compte
 * unique, tout l'argent des clients transiterait par Qualifyr avant d'être
 * reversé. Encaisser pour le compte d'autrui relève du statut d'établissement
 * de paiement, avec l'agrément qui va avec. Connect renverse le flux : le
 * paiement est créé *sur* le compte du professionnel, Qualifyr n'en est jamais
 * dépositaire, et la commission éventuelle est prélevée au passage.
 *
 * **Express et pas Standard.** Standard demande au professionnel de créer un
 * compte Stripe complet, avec tableau de bord, produits, API. Express est un
 * formulaire hébergé de cinq minutes — identité, IBAN, statut — après quoi il
 * ne revoit plus jamais Stripe. C'est la différence entre un detailer qui
 * s'inscrit et un detailer qui abandonne.
 *
 * **Pas de SDK Stripe.** L'API REST suffit pour les cinq appels dont on a
 * besoin, et la discipline du dépôt est de ne pas dépasser cinq dépendances.
 * Le paquet `stripe` pèse plusieurs mégaoctets pour des types que l'on écrit
 * ici en vingt lignes.
 */

const API = 'https://api.stripe.com/v1';

function secretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY manquante. Sans elle, aucun acompte ne peut être encaissé.',
    );
  }
  return key;
}

/**
 * Appel générique.
 *
 * Stripe attend du `application/x-www-form-urlencoded`, pas du JSON — une
 * erreur classique qui renvoie un 400 sans message utile.
 */
async function call<T>(
  path: string,
  params?: Record<string, string>,
  method: 'GET' | 'POST' = 'POST',
): Promise<T> {
  const body = params ? new URLSearchParams(params).toString() : undefined;

  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    ...(body ? { body } : {}),
    // Un paiement ne doit jamais être servi depuis un cache.
    cache: 'no-store',
  });

  const payload = (await response.json()) as T & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Stripe a répondu ${response.status}.`);
  }

  return payload;
}

/**
 * Montants en centimes.
 *
 * Stripe raisonne en plus petite unité monétaire ; le reste du schéma raisonne
 * en euros. La conversion est isolée ici pour qu'elle n'existe qu'à un seul
 * endroit — une erreur de facteur 100 disséminée dans le code se découvre le
 * jour d'un vrai encaissement.
 */
function toMinorUnit(amount: number): string {
  return String(Math.round(amount * 100));
}

export type StripeAccount = {
  readonly id: string;
  readonly charges_enabled: boolean;
  readonly details_submitted: boolean;
};

/** Crée le compte du professionnel. Appelé une seule fois par detailer. */
export async function createConnectedAccount(input: {
  readonly email: string;
  readonly country: 'FR' | 'CH';
  readonly businessName: string;
}): Promise<StripeAccount> {
  return call<StripeAccount>('/accounts', {
    type: 'express',
    country: input.country,
    email: input.email,
    'business_profile[name]': input.businessName,
    // Code d'activité « car washing », qui évite au professionnel de le
    // chercher dans une liste de six cents entrées.
    'business_profile[mcc]': '7542',
    'capabilities[card_payments][requested]': 'true',
    'capabilities[transfers][requested]': 'true',
  });
}

/**
 * Lien d'inscription, à ouvrir depuis le tableau de bord.
 *
 * Les liens Stripe expirent en quelques minutes : il faut en générer un neuf à
 * chaque clic, jamais le stocker.
 */
export async function createOnboardingLink(input: {
  readonly accountId: string;
  readonly returnUrl: string;
  readonly refreshUrl: string;
}): Promise<{ readonly url: string }> {
  return call<{ url: string }>('/account_links', {
    account: input.accountId,
    type: 'account_onboarding',
    return_url: input.returnUrl,
    refresh_url: input.refreshUrl,
  });
}

export async function retrieveAccount(accountId: string): Promise<StripeAccount> {
  return call<StripeAccount>(`/accounts/${accountId}`, undefined, 'GET');
}

/**
 * Session de paiement de l'acompte.
 *
 * **`payment_intent_data[application_fee_amount]` est volontairement absent.**
 * Aucune commission n'est prélevée sur les prestations : le modèle est
 * l'abonnement. Prélever les deux ferait payer deux fois le même service, et
 * c'est le premier reproche fait aux plateformes du secteur.
 *
 * L'en-tête `Stripe-Account` fait créer la session **sur le compte du
 * professionnel**. Sans lui, l'argent arriverait chez Qualifyr.
 */
export async function createDepositCheckout(input: {
  readonly accountId: string;
  readonly bookingId: string;
  readonly amount: number;
  readonly currency: 'eur' | 'chf';
  readonly detailerName: string;
  readonly clientEmail: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
}): Promise<{ readonly id: string; readonly url: string }> {
  const body = new URLSearchParams({
    mode: 'payment',
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.clientEmail,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': input.currency,
    'line_items[0][price_data][unit_amount]': toMinorUnit(input.amount),
    'line_items[0][price_data][product_data][name]': `Acompte — ${input.detailerName}`,
    'line_items[0][price_data][product_data][description]':
      'Acompte de réservation, déduit du montant final.',
    // L'identifiant de réservation voyage avec le paiement : c'est lui qui
    // permet au webhook de retrouver la ligne à confirmer, sans dépendre de
    // l'ordre d'arrivée des événements.
    'metadata[booking_id]': input.bookingId,
    'payment_intent_data[metadata][booking_id]': input.bookingId,
  }).toString();

  const response = await fetch(`${API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Account': input.accountId,
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
 * Vérifie la signature d'un webhook.
 *
 * **Sans cette vérification, n'importe qui peut confirmer n'importe quelle
 * réservation** en envoyant une requête à l'URL du webhook. C'est le trou de
 * sécurité le plus courant des intégrations de paiement.
 *
 * L'implémentation suit le schéma `t=…,v1=…` de Stripe : on recalcule le HMAC
 * de `timestamp.payload` et on compare en temps constant.
 */
export async function verifyWebhookSignature(input: {
  readonly payload: string;
  readonly header: string | null;
  readonly secret: string;
  /** Fenêtre de tolérance, contre le rejeu d'un ancien événement. */
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

  // Comparaison en temps constant : une comparaison naïve fuit la position du
  // premier caractère faux, ce qui suffit à reconstruire une signature.
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}
