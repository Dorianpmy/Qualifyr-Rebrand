/**
 * Contenu de la page Méthode.
 * Prolonge le positionnement de l'accueil sans le répéter : l'accueil annonce
 * les quatre temps, cette page dit ce qu'ils contiennent réellement.
 */

export const methodPage = {
  eyebrow: 'Méthode',
  title: 'Une méthode construite autour de votre activité.',
  lead: 'Avant de concevoir quoi que ce soit, nous cherchons à comprendre comment vos clients vous découvrent, choisissent une formule, réservent et reviennent.',
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
    body: 'Nous partons de la réalité du terrain, pas d’un modèle générique. Cette étape sert autant à vous qu’à nous : elle met à plat ce qui fonctionne déjà et ce qui coince.',
    itemsLabel: 'Ce que nous regardons',
    items: [
      'Votre activité et la façon dont vous la décrivez aujourd’hui',
      'Votre zone d’intervention et vos déplacements',
      'Vos prestations, de la plus courte à la plus complète',
      'Les véhicules, séjours, destinations ou besoins concernés',
      'Vos clients actuels et ceux que vous aimeriez avoir',
      'Les demandes que vous recevez, et celles qui n’aboutissent pas',
      'Votre organisation : agenda, matériel, disponibilités',
      'Les outils que vous utilisez déjà',
    ],
  },
  {
    number: '02',
    title: 'Clarifier',
    body: 'Un client qui hésite reporte. Nous rendons lisible ce que vous proposez, pour qui, où, à quelles conditions, et ce qui vous distingue concrètement.',
    itemsLabel: 'Ce que nous mettons au clair',
    items: [
      'Votre positionnement, en mots que vos clients emploient',
      'Vos formules, leurs différences et ce qu’elles contiennent',
      'Les bénéfices réels de chaque prestation',
      'Vos tarifs, si vous souhaitez les afficher',
      'Votre zone d’intervention et ses limites',
      'Le déroulement d’une prestation, du début à la fin',
      'Les éléments qui rassurent : matériel, durée, précautions',
    ],
  },
  {
    number: '03',
    title: 'Construire',
    body: 'Nous mettons en place le parcours, du premier contact jusqu’à la demande d’avis. Chaque élément existe parce qu’il sert une étape précise.',
    itemsLabel: 'Ce que nous mettons en place',
    items: [
      'La structure du parcours, étape par étape',
      'Les pages nécessaires — et seulement celles-là',
      'La demande de prestation et la réservation',
      'Les formulaires, pensés pour être remplis au pouce',
      'Le calendrier connecté, si vous en utilisez un',
      'Les confirmations envoyées au client',
      'Les demandes d’avis, au bon moment',
      'Le rendu mobile, traité en premier et non en dernier',
    ],
  },
  {
    number: '04',
    title: 'Améliorer',
    body: 'Un parcours se règle dans le temps. Nous observons ce qui se passe réellement et corrigeons ce qui freine encore une réservation.',
    itemsLabel: 'Ce que nous observons',
    items: [
      'Vos retours après quelques semaines d’usage',
      'Les demandes incomplètes et ce qui leur manque',
      'Les points où les visiteurs s’arrêtent',
      'Les informations que l’on vous redemande sans cesse',
      'Les évolutions à faire progressivement, sans tout refaire',
    ],
  },
];

export const toolsSection = {
  eyebrow: 'Outils',
  title: 'Nous utilisons les bons outils, pas forcément les plus nombreux.',
  body: [
    'Vous avez déjà une façon de travailler : un téléphone qui sonne, des messages, peut-être un agenda partagé ou une page sur laquelle on vous trouve. Notre premier réflexe n’est pas de remplacer tout cela.',
    'Nous regardons ce que vous utilisez, ce qui vous convient et ce qui vous fait perdre du temps. Nous conservons ce qui fonctionne, nous relions ce qui doit l’être, et nous ne remplaçons que ce qui pose réellement problème.',
    'Un outil de plus n’est utile que s’il retire une contrainte. Sinon, c’est une contrainte de plus.',
  ],
  principles: [
    {
      title: 'Partir de l’existant',
      body: 'Si votre agenda vous convient, nous le gardons et nous branchons le parcours dessus.',
    },
    {
      title: 'Limiter le nombre d’endroits',
      body: 'Moins il y a d’outils à ouvrir dans une journée, moins il y a d’informations perdues.',
    },
    {
      title: 'Vous laisser la main',
      body: 'Vous devez pouvoir comprendre, utiliser et modifier ce que nous mettons en place.',
    },
  ],
} as const;

export const verticalAdaptations = [
  {
    title: 'Nettoyage automobile mobile',
    body: 'Le parcours peut qualifier le véhicule, la formule, l’adresse d’intervention, la zone couverte et le créneau avant de confirmer, rappeler puis demander un avis.',
  },
  {
    title: 'Conciergeries',
    body: 'Le parcours peut présenter l’accompagnement, recueillir les informations sur le besoin, le séjour ou la destination, organiser l’échange et assurer un suivi clair.',
  },
] as const;

export const methodCta = {
  eyebrow: 'La suite',
  title: 'Présentez-nous votre fonctionnement actuel.',
  body: 'Nous partons de ce que vous faites déjà, pas d’une page blanche. Décrivez votre activité, nous verrons ensemble ce qui mérite d’être clarifié en premier.',
  label: 'Présenter mon fonctionnement actuel',
} as const;
