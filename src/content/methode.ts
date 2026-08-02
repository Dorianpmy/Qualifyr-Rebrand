/**
 * Contenu de la page Méthode.
 * Prolonge le positionnement de l'accueil sans le répéter : l'accueil annonce
 * les quatre temps, cette page dit ce qu'ils contiennent réellement.
 */

export const methodPage = {
  eyebrow: 'Méthode',
  title: 'Comprendre avant de construire.',
  lead: 'Quatre temps pour clarifier votre activité, concevoir le bon parcours et l’améliorer sans compliquer votre quotidien.',
} as const;

export type MethodDetail = {
  readonly number: string;
  readonly title: string;
  readonly body: string;
  readonly itemsLabel: string;
  readonly items: readonly string[];
};

export const methodDetails: readonly MethodDetail[] = [
  {
    number: '01',
    title: 'Comprendre',
    body: 'Nous partons de votre réalité, de vos clients et des demandes que vous recevez déjà.',
    itemsLabel: 'Ce que nous regardons',
    items: [
      'Votre activité et votre différence',
      'Vos prestations et votre zone',
      'Les demandes qui avancent ou se perdent',
    ],
  },
  {
    number: '02',
    title: 'Clarifier',
    body: 'Nous rendons votre offre lisible pour qu’un client sache rapidement quoi choisir et pourquoi.',
    itemsLabel: 'Ce que nous mettons au clair',
    items: [
      'Le message et la hiérarchie de l’offre',
      'Les formules et leurs différences',
      'Les informations qui rassurent',
    ],
  },
  {
    number: '03',
    title: 'Construire',
    body: 'Nous concevons les pages et les actions utiles, du premier regard jusqu’à la demande.',
    itemsLabel: 'Ce que nous mettons en place',
    items: [
      'Une structure courte et cohérente',
      'Une demande ou réservation plus simple',
      'Une expérience mobile soignée',
    ],
  },
  {
    number: '04',
    title: 'Améliorer',
    body: 'Nous ajustons ce qui crée encore de l’hésitation ou vous fait perdre du temps.',
    itemsLabel: 'Ce que nous observons',
    items: [
      'Les retours d’usage réels',
      'Les demandes encore incomplètes',
      'Les améliorations utiles, sans tout refaire',
    ],
  },
];

export const toolsSection = {
  eyebrow: 'Principe d’outillage',
  title: 'Conserver ce qui fonctionne.',
  body: 'Nous relions ou remplaçons uniquement ce qui crée une contrainte. Chaque outil ajouté doit retirer une difficulté et vous laisser la main.',
} as const;

export const verticalAdaptations = [
  {
    title: 'Nettoyage automobile mobile',
    body: 'Véhicule, formule, adresse, zone et créneau sont organisés avant la confirmation.',
  },
  {
    title: 'Conciergeries',
    body: 'Besoin, séjour ou destination sont précisés avant l’échange et le suivi.',
  },
] as const;

export const methodCta = {
  eyebrow: 'La suite',
  title: 'Présentez-nous votre fonctionnement actuel.',
  body: 'Nous partons de ce que vous faites déjà, pas d’une page blanche. Décrivez votre activité, nous verrons ensemble ce qui mérite d’être clarifié en premier.',
  label: 'Présenter mon fonctionnement actuel',
} as const;
