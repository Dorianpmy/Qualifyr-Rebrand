import type { Plan } from '@/lib/billing/plans';

/**
 * Les offres telles que la page Estimation les présente.
 *
 * ⚠️ **Cette grille est volontairement différente de celle du reste du site.**
 * Décision de Dorian, prise en connaissance de cause le 22/08/2026 : appliquer
 * les nouveaux prix ici seulement, et laisser `/tarifs`, `geo.ts` et
 * `FeatureComparisonTable` sur l'ancienne grille pour l'instant.
 *
 * | Offre | Ici | Reste du site |
 * |---|---|---|
 * | Agent seul | 9 €/mois | 17 €/mois |
 * | Réservation seule | 29 €/mois | 49 €/mois |
 * | Agent + Réservation | 39 €/mois | 59 €/mois |
 * | Site vitrine | dès 490 € | 690 – 1 290 € |
 * | Site + réservation | dès 990 € | 1 490 – 2 490 € |
 *
 * **Conséquence à connaître :** un visiteur qui passe d'ici à `/tarifs` verra
 * deux prix pour la même offre. C'est un écart assumé et temporaire, pas un
 * oubli. `tests/estimation.test.ts` le documente sans le faire échouer, pour
 * qu'il reste visible ; le jour où la grille est unifiée, il suffira de
 * reporter ces valeurs dans `PricingTable`, `DarkPricing` et `geo.ts`.
 *
 * ---
 *
 * **Les listes `included` et `excluded` ne sont pas rédactionnelles.** Chaque
 * entrée `included` correspond à une capacité réellement accordée par la
 * matrice de `lib/billing/entitlements.ts` — `tests/estimation.test.ts` le
 * vérifie offre par offre. Une ligne qu'on ajouterait ici sans droit
 * correspondant ferait échouer la suite, plutôt que d'être découverte par un
 * client après paiement.
 *
 * `excluded` est tout aussi important : dire ce qui n'est pas inclus évite la
 * déception qui suit une liste uniquement positive, et c'est la seule façon
 * honnête de vendre trois formules dont deux sont partielles.
 */

export type OfferId =
  | 'agent'
  | 'reservation'
  | 'pack'
  | 'site-vitrine'
  | 'site-reservation';

export type Offer = {
  readonly id: OfferId;
  /** Nom montré au prospect. */
  readonly name: string;
  /** Une phrase : à qui elle s'adresse. */
  readonly audience: string;
  /** Montant mensuel en euros, ou `null` pour une prestation ponctuelle. */
  readonly monthly: number | null;
  /**
   * Montant ponctuel en euros. `from: true` signifie « à partir de » — le prix
   * dépend alors du projet et ne doit jamais être annoncé comme définitif.
   */
  readonly oneOff: { readonly amount: number; readonly from: boolean } | null;
  /** Ce que l'offre contient réellement. */
  readonly included: readonly string[];
  /** Ce qu'elle ne contient pas, dit franchement. */
  readonly excluded: readonly string[];
  /**
   * Plan d'abonnement correspondant, pour brancher le paiement.
   * `null` pour les prestations d'agence, qui passent par un échange.
   */
  readonly plan: Plan | null;
  /** Où va le bouton principal. */
  readonly action: { readonly label: string; readonly href: string };
};

export const estimationOffers: readonly Offer[] = [
  {
    id: 'agent',
    name: 'Agent de recensement',
    audience:
      'Vous cherchez de nouveaux clients professionnels et vous n’avez pas le temps de démarcher.',
    monthly: 9,
    oneOff: null,
    included: [
      'Recensement des entreprises d’une zone à partir du répertoire officiel',
      'Un rapport de secteur envoyé par e-mail',
      'Hermès écrit à ces entreprises pour vous, à votre nom',
    ],
    excluded: [
      'Hermès envoie le premier message ; les relances et les appels restent à faire',
      'Pas de page de réservation en ligne',
      'Pas d’encaissement d’acompte',
      'Pas de planning ni de facturation',
    ],
    plan: 'agent',
    action: { label: 'Voir le détail de l’offre', href: '/tarifs' },
  },
  {
    id: 'reservation',
    name: 'Système de réservation',
    audience:
      'Les demandes, vous les avez déjà. Ce sont les devis du soir et les créneaux perdus qui vous coûtent.',
    monthly: 29,
    oneOff: null,
    included: [
      'Page de réservation en ligne à votre nom',
      'Prix et durée affichés avant la réservation',
      'Acompte encaissé au moment de la réservation',
      'Planning et prestations',
      'Factures',
      'Galerie avant/après',
      'Relance automatique des devis abandonnés',
    ],
    excluded: [
      'Pas de recensement d’entreprises',
      'Pas de rapport de secteur',
    ],
    plan: 'system',
    action: { label: 'Voir le détail de l’offre', href: '/tarifs' },
  },
  {
    id: 'pack',
    name: 'Agent + Réservation',
    audience:
      'Vous voulez à la fois trouver des clients et éviter les rendez-vous non honorés.',
    monthly: 39,
    oneOff: null,
    included: [
      'Tout l’agent de recensement',
      'Tout le système de réservation',
      'Les deux sur le même compte, un seul abonnement',
    ],
    excluded: ['Le site vitrine reste une prestation à part'],
    plan: 'complete',
    action: { label: 'Voir le détail de l’offre', href: '/tarifs' },
  },
  {
    id: 'site-vitrine',
    name: 'Site vitrine',
    audience: 'Vous n’avez pas encore de site, ou celui que vous avez ne vous ressemble plus.',
    monthly: null,
    oneOff: { amount: 490, from: true },
    included: [
      'Trois à cinq pages',
      'Structure des contenus et mise en page',
      'Formulaire de contact',
    ],
    excluded: [
      'Pas de réservation en ligne',
      'Pas d’abonnement au logiciel : c’est une prestation ponctuelle',
    ],
    plan: null,
    action: { label: 'Demander une confirmation', href: '/contact' },
  },
  {
    id: 'site-reservation',
    name: 'Site + parcours de réservation',
    audience:
      'Vous voulez un site professionnel qui prenne aussi les réservations, sans outil séparé.',
    monthly: null,
    oneOff: { amount: 990, from: true },
    included: [
      'Le site vitrine complet',
      'Le parcours de réservation intégré au site',
      'Mise en place de votre grille tarifaire',
    ],
    excluded: [
      'L’abonnement mensuel au système de réservation reste dû, en plus de la création',
    ],
    plan: null,
    action: { label: 'Demander une confirmation', href: '/contact' },
  },
] as const;

export const offerById: Readonly<Record<OfferId, Offer>> = Object.fromEntries(
  estimationOffers.map((offer) => [offer.id, offer]),
) as Readonly<Record<OfferId, Offer>>;

/**
 * Mention affichée sous chaque recommandation.
 *
 * Elle n'est pas une précaution juridique de façade : le calcul repose sur des
 * réponses déclaratives, et deux activités identiques sur le papier peuvent
 * appeler deux réponses différentes.
 */
export const estimationDisclaimer =
  'Cette estimation est indicative. Elle repose sur vos réponses et peut être confirmée avec nous selon vos besoins exacts.';
