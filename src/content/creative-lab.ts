export type CreativeLabItem = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly status: 'concept' | 'coming-soon';
  readonly statusLabel: string;
  readonly visual: 'conciergerie' | 'identity' | 'motion';
  readonly modalContent?: string;
  readonly explores?: readonly string[];
};

export const creativeLab = {
  eyebrow: 'Laboratoire créatif',
  title: 'Des idées rendues visibles.',
  subtitle:
    'Trois études créatives pour montrer comment une identité, une interface et un parcours peuvent prendre forme.',
  disclaimer:
    'Les éléments signalés comme concepts sont des démonstrations créatives et non des projets clients livrés.',
  items: [
    {
      id: 'concept-conciergerie',
      title: 'Conciergerie',
      subtitle: 'Direction · Présentation · Parcours',
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
      subtitle: 'Logo · Couleurs · Supports',
      description:
        'Une identité pensée pour créer une impression cohérente sur le site, les réseaux et les supports professionnels.',
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
      subtitle: 'Interface · Mouvement · Détail',
      description:
        'Une future démonstration de la manière dont les interfaces Qualifyr peuvent prendre vie sans détourner l’attention du contenu.',
      status: 'coming-soon',
      statusLabel: 'En préparation',
      visual: 'motion',
      modalContent:
        'Concept créatif en cours de développement. Le mouvement sera utilisé pour guider l’attention entre les informations, jamais pour simuler une vidéo ou ajouter du bruit.',
      explores: ['Le rythme de lecture', 'Les transitions entre les étapes', 'Le respect du mouvement réduit'],
    },
  ] as readonly CreativeLabItem[],
} as const;
