/**
 * Textes stratégiques de la marque.
 * Source : docs/01-positionnement.md — toute modification doit d'abord être
 * validée dans ce document.
 *
 * Règle : la promesse et le texte d'explication ne se reformulent jamais
 * d'une page à l'autre. Ils sont repris au mot près depuis ce fichier.
 */

export const brand = {
  name: 'Qualifyr',
  fullName: 'Qualifyr Agence',
  /** Mot de la marque. La mise en capitales est faite par le CSS du logo. */
  wordmark: 'Qualifyr',
  wordmarkSuffix: 'Agence',

  /** Promesse principale. Titre principal de l'accueil. */
  promise: 'Faites grandir votre activité de services.',

  /** Texte d'explication principal, systématiquement associé à la promesse. */
  explanation:
    'Qualifyr construit le parcours qui vous aide à être trouvé, compris, choisi, réservé puis recommandé, sans multiplier les outils ni compliquer votre quotidien.',

  /** Formulation courte, pour le pied de page et les métadonnées. */
  descriptor:
    'Agence spécialisée dans le développement des entreprises de nettoyage automobile mobile et des conciergeries.',

  /** Nom provisoire de l'offre unique. */
  offerName: 'Le parcours Qualifyr',
} as const;

/** Les six étapes du parcours. Vocabulaire de référence, non paraphrasable. */
export const journey = [
  { number: '01', label: 'Être trouvé' },
  { number: '02', label: 'Être compris' },
  { number: '03', label: 'Être choisi' },
  { number: '04', label: 'Être réservé plus facilement' },
  { number: '05', label: 'Obtenir des avis' },
  { number: '06', label: 'Favoriser les nouvelles réservations' },
] as const;

/**
 * Déroulé d'une collaboration. Quatre temps, sans durée annoncée :
 * aucun délai n'est promis tant qu'il n'est pas un engagement tenu.
 */
export const collaboration = [
  {
    number: '01',
    title: 'Cadrage',
    body: 'Nous partons de votre activité réelle : vos prestations, votre zone, vos demandes, vos réservations et vos contraintes de terrain.',
  },
  {
    number: '02',
    title: 'Conception',
    body: 'Nous structurons ce que vous proposez et la façon dont un client le découvre, le comprend et le réserve.',
  },
  {
    number: '03',
    title: 'Mise en place',
    body: 'Le parcours est installé, testé sur téléphone comme sur ordinateur, puis remis entre vos mains.',
  },
  {
    number: '04',
    title: 'Ajustement',
    body: 'Nous observons ce qui se passe réellement et corrigeons ce qui freine encore une réservation.',
  },
] as const;

/**
 * Appel à l'action principal, unique sur tout le site.
 * Formulation conversationnelle : on propose un échange, pas un formulaire.
 * Elle remplace « Demander un diagnostic » (voir docs/01-positionnement.md, §9).
 */
export const primaryCta = {
  label: 'Parler de mon activité',
  href: '/diagnostic',
} as const;
