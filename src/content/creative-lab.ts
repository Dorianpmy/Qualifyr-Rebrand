export type CreativeLabItem = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly status: 'realisation' | 'concept' | 'exploration' | 'coming-soon';
  readonly statusLabel: string;
  readonly visual: 'sw-car-cleaning' | 'conciergerie' | 'identity' | 'motion';
  readonly href?: string;
  readonly image?: {
    readonly src: string;
    readonly alt: string;
    readonly width: number;
    readonly height: number;
  };
  readonly modalContent?: string;
  readonly explores?: readonly string[];
  readonly featured?: boolean;
};

export const creativeLab = {
  eyebrow: 'Notre laboratoire créatif',
  title: 'Des idées rendues visibles.',
  subtitle:
    'Nous explorons de nouvelles façons de présenter les entreprises de services à travers des identités, des interfaces, des mises en scène et des expériences digitales.',
  disclaimer:
    'Les éléments signalés comme concepts sont des démonstrations créatives et non des projets clients livrés.',
  items: [
    {
      id: 'sw-car-cleaning',
      title: 'SW Car Cleaning',
      subtitle: 'Site • Identité • Expérience',
      description:
        'Une identité et un site conçus pour présenter clairement une activité de nettoyage automobile et faciliter la prise de contact.',
      status: 'realisation',
      statusLabel: 'Réalisation',
      visual: 'sw-car-cleaning',
      href: '/realisations/sw-car-cleaning',
      image: {
        src: '/images/sw-car-cleaning/site-accueil.webp',
        alt: 'Page d’accueil réelle du site SW Car Cleaning.',
        width: 1440,
        height: 900,
      },
      featured: true,
    },
    {
      id: 'concept-conciergerie',
      title: 'Conciergerie',
      subtitle: 'Direction • Présentation • Parcours',
      description:
        'Une exploration visuelle autour d’une conciergerie premium, pensée pour rassurer et faciliter la prise de contact.',
      status: 'concept',
      statusLabel: 'Concept',
      visual: 'conciergerie',
      modalContent:
        'Ce concept étudie une présentation calme et précise : le besoin est compris avant l’échange, le périmètre de l’accompagnement reste lisible et chaque étape prépare la suivante.',
      explores: ['La compréhension du besoin', 'Le cadre de l’accompagnement', 'Le passage vers un échange'],
    },
    {
      id: 'identite-visuelle',
      title: 'Identité visuelle',
      subtitle: 'Logo • Couleurs • Supports',
      description:
        'Une identité pensée pour créer une impression plus cohérente sur le site, les réseaux et les supports professionnels.',
      status: 'concept',
      statusLabel: 'Concept',
      visual: 'identity',
      modalContent:
        'Cette étude relie typographie, palette et composition afin qu’une entreprise conserve la même présence d’un support à l’autre, sans surjouer son image.',
      explores: ['Une signature typographique', 'Une palette éditoriale', 'La cohérence entre les supports'],
    },
    {
      id: 'motion-ui',
      title: 'Motion UI',
      subtitle: 'Interface • Mouvement • Détail',
      description:
        'Une future démonstration animée de la manière dont les interfaces Qualifyr peuvent prendre vie.',
      status: 'coming-soon',
      statusLabel: 'En préparation',
      visual: 'motion',
      modalContent:
        'Concept créatif en cours de développement. Le mouvement sera utilisé pour guider l’attention entre les informations, jamais pour simuler une vidéo ou ajouter du bruit.',
      explores: ['Le rythme de lecture', 'Les transitions entre les étapes', 'Le respect du mouvement réduit'],
    },
  ] as readonly CreativeLabItem[],
} as const;
