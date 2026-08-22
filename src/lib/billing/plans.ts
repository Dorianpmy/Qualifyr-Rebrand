/**
 * Plans et statuts d'abonnement — le vocabulaire commun.
 *
 * **Deux vocabulaires coexistent, et c'est assumé.** Les métadonnées Stripe et
 * les noms de variables d'environnement portent les identifiants français
 * historiques (`agent`, `complet`, `systeme` ; `STRIPE_PRICE_SYSTEME_MONTHLY`).
 * Le modèle de données, lui, utilise `agent`, `system`, `complete`.
 *
 * Renommer côté Stripe aurait orphelin toute session de paiement déjà créée
 * avec l'ancienne valeur — un abonnement souscrit hier arriverait avec
 * `plan=complet` et ne serait plus reconnu. La traduction se fait donc ici,
 * en un seul endroit, dans un seul sens : Stripe → base.
 *
 * Ce fichier ne dépend de rien. Il est importable côté serveur comme côté
 * navigateur, et testable sans base ni réseau.
 */

/** Plans tels qu'enregistrés en base (`subscriptions.plan`). */
export const PLANS = ['agent', 'system', 'complete'] as const;
export type Plan = (typeof PLANS)[number];

/** Statuts tels qu'enregistrés en base (`subscriptions.status`). */
export const SUBSCRIPTION_STATUSES = [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export function isPlan(value: unknown): value is Plan {
  return typeof value === 'string' && (PLANS as readonly string[]).includes(value);
}

export function isSubscriptionStatus(value: unknown): value is SubscriptionStatus {
  return (
    typeof value === 'string' && (SUBSCRIPTION_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * Traduit un identifiant de plan venu de Stripe vers celui du modèle de
 * données.
 *
 * Accepte les deux vocabulaires : les valeurs françaises des métadonnées
 * existantes, et les valeurs canoniques (au cas où une session serait créée
 * directement avec elles). Toute autre valeur renvoie `null` — le webhook
 * doit alors refuser d'accorder un droit plutôt que de deviner. Accorder par
 * défaut serait la faille : une métadonnée absente ouvrirait tout le SaaS.
 */
export function planFromStripe(value: unknown): Plan | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();

  switch (normalized) {
    case 'agent':
      return 'agent';
    case 'systeme':
    case 'système':
    case 'system':
      return 'system';
    case 'complet':
    case 'complete':
      return 'complete';
    default:
      return null;
  }
}

/**
 * Traduit un statut Stripe vers celui du modèle de données.
 *
 * Les sept statuts d'abonnement de Stripe portent déjà les noms retenus en
 * base : la fonction ne fait donc que valider. Un statut inconnu — Stripe
 * peut en ajouter — est ramené à `incomplete`, l'état le plus restrictif qui
 * n'est pas terminal : l'accès est refusé, mais l'abonnement reste
 * réactivable par l'événement suivant.
 */
export function statusFromStripe(value: unknown): SubscriptionStatus {
  if (isSubscriptionStatus(value)) return value;
  return 'incomplete';
}

/** Périodicité de facturation, telle qu'enregistrée. */
export type BillingInterval = 'month' | 'year';

export function intervalFromStripe(value: unknown): BillingInterval {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  // `annual` est la valeur utilisée par les métadonnées de ce projet ;
  // `year` celle de l'API Stripe.
  if (normalized === 'year' || normalized === 'annual' || normalized === 'annuel') return 'year';
  return 'month';
}

/** Libellé commercial, pour l'interface. Une seule source. */
export const PLAN_LABELS: Readonly<Record<Plan, string>> = {
  agent: 'Agent seul',
  system: 'Système seul',
  complete: 'Pack complet',
};
