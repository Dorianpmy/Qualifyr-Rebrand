import { PLANS, type Plan, type SubscriptionStatus } from './plans';

/**
 * Le système central de permissions.
 *
 * **Une seule matrice, lue par le serveur et par l'interface.** Dupliquer la
 * règle « le plan Agent n'a pas accès aux factures » à deux endroits garantit
 * qu'ils divergeront : l'interface finira par montrer un module que le serveur
 * refuse, ou l'inverse. Ici, `canAccess` est la seule autorité, et les gardes
 * de routes comme les écrans verrouillés l'appellent.
 *
 * **Refus par défaut, sans exception.** Toutes les portes de sortie de
 * `hasCapability` renvoient `false` : pas d'abonnement, plan inconnu, statut
 * terminal, capacité inconnue. Un droit ne s'obtient jamais par omission — la
 * faute inverse (accorder faute de savoir) ouvrirait tout le SaaS au premier
 * champ manquant.
 *
 * **Ce fichier ne touche ni à la base ni au réseau.** Il est purement
 * fonctionnel, donc entièrement testable — voir `tests/entitlements.test.ts`.
 * La lecture de l'abonnement vit dans `lib/billing/subscription.ts`.
 */

/**
 * Les capacités du produit.
 *
 * Le découpage suit les modules réellement vendus, pas les routes : une même
 * capacité peut protéger plusieurs routes (`invoices` couvre la page, l'API et
 * l'export XML), et c'est voulu — un client n'achète pas une route.
 */
export const CAPABILITIES = [
  /** Zones de prospection : création, consultation, liste des prospects. */
  'agent.prospecting',
  /** Analyse d'une zone et rapport de secteur par e-mail. */
  'agent.report',
  /** Tableau de bord des demandes. */
  'dashboard',
  /** Planning des créneaux. */
  'planning',
  /** Catalogue de prestations et grille tarifaire. */
  'services',
  /** Page de réservation publique du professionnel. */
  'booking.public',
  /** Encaissement d'acompte (Stripe Connect). */
  'payments.deposit',
  /** Factures, y compris l'export au format électronique. */
  'invoices',
  /** Galerie avant/après. */
  'gallery',
  /** Relance automatique des demandes non payées. */
  'booking.recovery',
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/**
 * Les capacités du produit « système de réservation », vendues ensemble.
 * Nommées une fois pour que `system` et `complete` ne puissent pas diverger
 * par oubli lors d'un ajout.
 */
const SYSTEM_CAPABILITIES: readonly Capability[] = [
  'dashboard',
  'planning',
  'services',
  'booking.public',
  'payments.deposit',
  'invoices',
  'gallery',
  'booking.recovery',
];

/** Les capacités du produit « agent ». */
const AGENT_CAPABILITIES: readonly Capability[] = ['agent.prospecting', 'agent.report'];

/**
 * La matrice.
 *
 * Elle doit rester alignée sur le tableau commercial de
 * `components/agency/FeatureComparisonTable.tsx` — un test le vérifie, pour
 * qu'une ligne ajoutée au tableau de tarifs sans droit correspondant fasse
 * échouer la suite plutôt que de se découvrir chez un client.
 */
const MATRIX: Readonly<Record<Plan, readonly Capability[]>> = {
  agent: AGENT_CAPABILITIES,
  system: SYSTEM_CAPABILITIES,
  complete: [...AGENT_CAPABILITIES, ...SYSTEM_CAPABILITIES],
};

/**
 * Statuts qui ouvrent l'accès complet aux capacités du plan.
 *
 * `past_due` en fait partie **volontairement** : une carte expirée est le cas
 * le plus banal du paiement récurrent, et couper l'accès au premier échec
 * ferait perdre un client qui n'a rien fait de mal. Stripe réessaie plusieurs
 * jours ; l'interface avertit pendant ce temps (voir `subscriptionNotice`), et
 * le passage en `unpaid` ou `canceled` coupe réellement.
 */
const ACTIVE_STATUSES: readonly SubscriptionStatus[] = ['trialing', 'active', 'past_due'];

/**
 * Statuts en lecture seule : les données restent consultables, plus rien ne
 * peut être créé ni modifié. Une résiliation ne doit jamais faire disparaître
 * un historique de factures.
 */
const READ_ONLY_STATUSES: readonly SubscriptionStatus[] = ['canceled'];

/** L'abonnement tel que le reste du code le manipule. */
export type Entitlement = {
  readonly plan: Plan;
  readonly status: SubscriptionStatus;
  /** Fin de la période en cours, si connue. */
  readonly currentPeriodEnd: string | null;
  /** Fin d'essai, si le compte est en essai. */
  readonly trialEndsAt: string | null;
  /** L'abonnement s'arrête à la fin de la période en cours. */
  readonly cancelAtPeriodEnd: boolean;
};

/** Vrai si le statut ouvre l'accès en écriture. */
export function isActiveStatus(status: SubscriptionStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

/** Vrai si le statut n'ouvre plus que la consultation. */
export function isReadOnlyStatus(status: SubscriptionStatus): boolean {
  return READ_ONLY_STATUSES.includes(status);
}

/**
 * Le plan seul donne-t-il cette capacité ?
 *
 * Ignore le statut : c'est la question « qu'est-ce que cette offre inclut »,
 * utile pour afficher un comparatif ou expliquer quel plan débloque un module.
 * Pour décider d'un accès réel, utiliser `canAccess`.
 */
export function planIncludes(plan: Plan, capability: Capability): boolean {
  return MATRIX[plan].includes(capability);
}

/** Les capacités d'un plan, pour l'affichage. */
export function capabilitiesOf(plan: Plan): readonly Capability[] {
  return MATRIX[plan];
}

/** Les plans qui incluent une capacité — sert à dire « à partir de tel plan ». */
export function plansWith(capability: Capability): readonly Plan[] {
  return PLANS.filter((plan) => planIncludes(plan, capability));
}

/**
 * **La fonction d'autorisation.** Tout contrôle d'accès passe par elle.
 *
 * @param entitlement L'abonnement du compte, ou `null` s'il n'en a aucun.
 * @param capability La capacité demandée.
 * @param options `write: false` autorise la consultation d'un abonnement
 *   résilié. Par défaut, la demande est considérée comme une écriture — le
 *   choix le plus restrictif, pour qu'un appel négligent ne devienne pas une
 *   ouverture.
 */
export function canAccess(
  entitlement: Entitlement | null | undefined,
  capability: Capability,
  options?: { readonly write?: boolean },
): boolean {
  // Aucun abonnement : aucun droit. C'est le cas d'un compte créé à la main
  // ou d'un paiement jamais abouti.
  if (!entitlement) return false;

  // Capacité inconnue (appel non typé, valeur venue d'une URL) : refus.
  if (!(CAPABILITIES as readonly string[]).includes(capability)) return false;

  // Plan inconnu : refus. Ne peut arriver qu'avec une donnée corrompue,
  // puisque la base porte une contrainte `check` sur cette colonne.
  if (!(PLANS as readonly string[]).includes(entitlement.plan)) return false;

  // Le plan doit inclure la capacité, quel que soit le statut.
  if (!planIncludes(entitlement.plan, capability)) return false;

  const write = options?.write ?? true;

  if (isActiveStatus(entitlement.status)) return true;
  if (!write && isReadOnlyStatus(entitlement.status)) return true;

  // `unpaid`, `incomplete`, `incomplete_expired`, et `canceled` en écriture.
  return false;
}

/**
 * Pourquoi l'accès est-il refusé ? Sert à afficher un message juste plutôt
 * qu'un « indisponible » qui n'apprend rien.
 *
 * Renvoie `null` quand l'accès est accordé.
 */
export type DenialReason =
  | 'no-subscription'
  | 'plan-excludes'
  | 'read-only'
  | 'payment-required';

export function denialReason(
  entitlement: Entitlement | null | undefined,
  capability: Capability,
  options?: { readonly write?: boolean },
): DenialReason | null {
  if (canAccess(entitlement, capability, options)) return null;
  if (!entitlement) return 'no-subscription';
  if (!planIncludes(entitlement.plan, capability)) return 'plan-excludes';
  if (isReadOnlyStatus(entitlement.status)) return 'read-only';
  return 'payment-required';
}

/**
 * Où envoyer un compte à la connexion.
 *
 * Un abonné « Agent seul » n'a pas accès au tableau de bord : l'envoyer sur
 * `/app` le ferait arriver sur un écran verrouillé, ce qui donne l'impression
 * d'un produit cassé alors qu'il a exactement ce qu'il a acheté.
 */
export function landingPathFor(entitlement: Entitlement | null | undefined): string {
  if (!entitlement) return '/app/abonnement';
  if (canAccess(entitlement, 'dashboard', { write: false })) return '/app';
  if (canAccess(entitlement, 'agent.prospecting', { write: false })) return '/app/prospection';
  return '/app/abonnement';
}
