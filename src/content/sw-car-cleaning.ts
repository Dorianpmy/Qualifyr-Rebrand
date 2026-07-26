/**
 * Étude de cas SW Carcleaning — source unique.
 *
 * SW Carcleaning est une réalisation réelle. Le site est en ligne à l'adresse
 * https://www.swcarcleaning.ch/ ; son contenu a été fourni par Dorian et
 * **chaque affirmation de cette page en découle directement**. Le champ
 * `source` de chaque livrable indique l'élément du site qui le justifie, pour
 * que la vérification reste possible.
 *
 * INTERDICTIONS ABSOLUES pour ce fichier (AGENTS.md, §6) :
 * résultat, pourcentage, chiffre d'affaires, hausse de réservations,
 * témoignage, nombre de visiteurs, date, fonctionnalité non confirmée.
 *
 * Les tarifs publics de SW Carcleaning ne sont **pas** repris : ils évoluent,
 * et ce qui compte ici est la décision de conception — afficher un prix
 * d'entrée dès la première page — pas son montant.
 */

export type CaseImage = {
  readonly src: string;
  /** Texte alternatif descriptif, écrit à la main. Obligatoire. */
  readonly alt: string;
  readonly width: number;
  readonly height: number;
};

export type GalleryItem = CaseImage & {
  readonly device: 'desktop' | 'mobile';
  readonly caption: string;
};

export const swCarCleaning = {
  client: 'SW Carcleaning',
  sector: 'Nettoyage automobile à domicile',
  summary:
    'Une identité et une expérience conçues pour présenter clairement un service de nettoyage automobile et faciliter la prise de contact.',

  /** URL publique, confirmée par le `canonical` du site fourni. */
  externalUrl: 'https://www.swcarcleaning.ch/' as string | null,

  /**
   * Logo du client. `null` : le seul fichier de marque disponible est un
   * favicon — un pictogramme de voiture générique en bleu électrique. Il n'est
   * pas repris, pour deux raisons : ce n'est pas un logotype, et le bleu
   * électrique est proscrit par la direction artistique (AGENTS.md, §5).
   * Le panneau de projet reste typographique. Voir docs/06, §2.1.
   */
  logo: null as CaseImage | null,

  /**
   * Galerie. Vide : aucune capture d'écran n'a été fournie, seulement le code
   * source de la page. La section se masque d'elle-même.
   * Voir docs/06, §2.2.
   */
  gallery: [] as readonly GalleryItem[],
} as const;

export const casePage = {
  eyebrow: 'Réalisation',
  title: 'SW Carcleaning',
  subtitle:
    'Une identité et une expérience conçues pour présenter clairement un service de nettoyage automobile.',
} as const;

/**
 * Section 1 — contexte.
 * Faits du secteur, et faits établis à partir du site lui-même.
 */
export const context = {
  title: 'Présenter une activité de service de manière claire et crédible.',
  body: [
    'SW Carcleaning lave et prépare les véhicules directement chez le client, à Fribourg et dans les environs. Le travail est entièrement manuel : pré-lavage, lavage, séchage et finitions, sans passage en station automatique, pour limiter les micro-rayures.',
    'C’est précisément ce qui se voit le moins avant la prestation. Un client doit choisir sans avoir rien vu, le plus souvent depuis son téléphone, entre deux occupations, en comparant rapidement.',
    'Une présentation claire ne consiste donc pas à en dire plus, mais à répondre plus tôt : ce que couvre chaque formule, pour qui, jusqu’où le service se déplace, et comment entrer en contact sans avoir à chercher.',
  ],
  aspects: [
    { label: 'Activité', value: 'Lavage et detailing à domicile' },
    { label: 'Zone', value: 'Fribourg et alentours' },
    { label: 'Méthode', value: '100 % à la main' },
    { label: 'Publics', value: 'Particuliers, entreprises, entretien régulier' },
  ],
} as const;

/**
 * Section 2 — objectifs.
 * Ce sont des intentions de projet, PAS des résultats mesurés.
 * Le composant affiche cette précision de manière visible.
 */
export const objectives = [
  {
    number: '01',
    title: 'Clarifier les prestations',
    body: 'Rendre immédiatement compréhensible ce que contient chaque formule et ce qui les distingue.',
  },
  {
    number: '02',
    title: 'Renforcer la perception de qualité',
    body: 'Faire ressentir le niveau de soin apporté au travail avant même la première prestation.',
  },
  {
    number: '03',
    title: 'Offrir une expérience cohérente',
    body: 'Aligner l’identité, le ton et la présentation, du premier écran jusqu’à la prise de contact.',
  },
  {
    number: '04',
    title: 'Faciliter la prise de contact',
    body: 'Réduire le nombre d’étapes et d’hésitations entre l’intérêt d’un visiteur et son premier message.',
  },
  {
    number: '05',
    title: 'Adapter le contenu au mobile',
    body: 'Penser la lecture et la navigation pour un écran de téléphone tenu à une main.',
  },
] as const;

/**
 * Section 3 — travail réalisé.
 * Chaque entrée est vérifiable sur le site en ligne. `source` indique quoi
 * regarder. Ne rien ajouter qui ne soit pas constatable.
 */
export const deliverables = [
  {
    number: '01',
    title: 'Direction artistique et identité',
    body: 'Définition de l’univers visuel du service : registre, typographie, traitement des couleurs et des images.',
    source: 'identité visuelle du site',
  },
  {
    number: '02',
    title: 'Structure du parcours',
    body: 'Un enchaînement court — services, formules, abonnements, zone, contact — qui suit l’ordre des questions que se pose un client.',
    source: 'navigation : Accueil, Services, Formules, Abonnements, Zone, Contact',
  },
  {
    number: '03',
    title: 'Présentation des formules',
    body: 'Intérieur, extérieur ou les deux, et trois publics distingués : particuliers, entreprises, entretien régulier. Chacun trouve son entrée sans avoir à interpréter.',
    source: 'section « Trouvez votre formule » et blocs de publics',
  },
  {
    number: '04',
    title: 'Zone d’intervention affichée',
    body: 'Le périmètre couvert est indiqué explicitement. Une demande hors secteur est écartée avant l’échange, pas après.',
    source: 'section « Zone d’intervention »',
  },
  {
    number: '05',
    title: 'Parcours de prise de contact',
    body: 'Un message pré-rempli qui part du site vers la messagerie du client, avec le contexte déjà posé. L’échange commence sur du concret.',
    source: 'boutons de devis et de conseil, message pré-rempli',
  },
  {
    number: '06',
    title: 'Cadre de confiance',
    body: 'Prix d’entrée annoncé dès la première page, ajustements signalés avant la prestation, conditions générales et politique de confidentialité publiées.',
    source: 'section « Un nettoyage clair, sans mauvaise surprise », CGV, politique de confidentialité',
  },
] as const;

/** Section 5 — enseignement. */
export const lesson = {
  title: 'Un projet qui illustre l’approche Qualifyr.',
  body: 'Ce projet montre ce que nous cherchons à relier sur chaque activité de nettoyage automobile : ce que vous êtes, ce que l’on comprend de vous, ce qui rassure, et le moment où l’on vous écrit. Ces quatre choses ne se traitent pas séparément.',
  links: [
    {
      number: '01',
      title: 'Positionnement',
      body: 'Ce que vous proposez, pour qui, et ce qui vous distingue concrètement.',
    },
    {
      number: '02',
      title: 'Compréhension',
      body: 'La même chose, formulée de sorte qu’un client la saisisse en quelques secondes.',
    },
    {
      number: '03',
      title: 'Confiance',
      body: 'Ce qui donne envie de vous confier un véhicule : le soin visible, la précision, la cohérence.',
    },
    {
      number: '04',
      title: 'Prise de contact',
      body: 'Le moment décisif. Il doit être évident, court, et arriver quand la confiance est là.',
    },
  ],
} as const;

export const caseCta = {
  eyebrow: 'La suite',
  title: 'Parlons de votre activité de nettoyage automobile.',
  body: 'Votre zone, vos prestations, votre façon de recevoir les demandes. Nous verrons ensemble ce qui mérite d’être clarifié en premier.',
} as const;
