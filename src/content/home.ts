import { swCarCleaning } from './sw-car-cleaning';

/**
 * Contenu de la page d'accueil.
 *
 * Tout le texte stratégique vit ici : aucune phrase de vente n'est écrite en
 * dur dans un composant. Les règles de `docs/01-positionnement.md` s'appliquent
 * intégralement — vouvoiement, phrases courtes, aucun chiffre, aucun terme
 * interdit, aucune promesse de résultat.
 */

/** Sur-titre du hero. Nomme la cible unique, sans détour. */
export const heroEyebrow = 'Pour les professionnels du nettoyage automobile mobile';

export const heroLine = [
  'Positionnement',
  'Réservation',
  'Visibilité locale',
  'Avis',
  'Fidélisation',
] as const;

/** Les moments du parcours client représentés dans la composition du hero. */
export const heroMoments = [
  { number: '01', label: 'Découverte locale' },
  { number: '02', label: 'Choix d’une formule' },
  { number: '03', label: 'Sélection du véhicule' },
  { number: '04', label: 'Adresse d’intervention' },
  { number: '05', label: 'Réservation' },
  { number: '06', label: 'Confirmation' },
  { number: '07', label: 'Demande d’avis' },
] as const;

export const problems = [
  {
    title: 'Votre offre est mal comprise',
    body: 'Le client hésite entre plusieurs formules et finit par remettre sa décision à plus tard.',
  },
  {
    title: 'Réserver demande trop d’efforts',
    body: 'Messages, appels, disponibilité, adresse et type de véhicule sont récupérés dans plusieurs échanges.',
  },
  {
    title: 'La relation s’arrête après la prestation',
    body: 'Les avis, recommandations et nouvelles réservations ne sont pas suffisamment encouragés.',
  },
] as const;

export const pillars = [
  {
    number: '01',
    title: 'Être trouvé',
    body: 'Présenter votre activité clairement et rendre vos services visibles dans les zones que vous couvrez.',
  },
  {
    number: '02',
    title: 'Être réservé',
    body: 'Permettre au client de comprendre, choisir et demander une prestation sans parcours compliqué.',
  },
  {
    number: '03',
    title: 'Faire revenir',
    body: 'Prolonger la relation grâce aux avis, aux rappels et à une expérience cohérente.',
  },
] as const;

/** Le parcours vécu par le client final, de la recherche à la réservation suivante. */
export const clientJourney = [
  { number: '01', label: 'Le client vous découvre' },
  { number: '02', label: 'Il comprend vos formules' },
  { number: '03', label: 'Il vérifie que vous intervenez dans sa zone' },
  { number: '04', label: 'Il choisit son véhicule et sa prestation' },
  { number: '05', label: 'Il demande ou réserve un créneau' },
  { number: '06', label: 'Il reçoit les bonnes informations' },
  { number: '07', label: 'Il bénéficie de la prestation' },
  { number: '08', label: 'Il laisse un avis' },
  { number: '09', label: 'Il peut réserver à nouveau' },
] as const;

export const offer = [
  {
    number: '01',
    title: 'Clarifier votre offre',
    body: 'Prestations, formules, zones, bénéfices et différences.',
  },
  {
    number: '02',
    title: 'Construire votre point d’entrée',
    body: 'Une expérience claire, premium et adaptée au mobile.',
  },
  {
    number: '03',
    title: 'Simplifier la réservation',
    body: 'Véhicule, prestation, adresse, zone, créneau et informations utiles.',
  },
  {
    number: '04',
    title: 'Renforcer la confiance',
    body: 'Preuves, réalisations, méthode, avis et déroulement de la prestation.',
  },
  {
    number: '05',
    title: 'Améliorer dans le temps',
    body: 'Observer les demandes, supprimer les freins et faire évoluer le parcours.',
  },
] as const;

export const comparison = {
  before: [
    'Formules envoyées par message',
    'Disponibilités vérifiées manuellement',
    'Informations incomplètes',
    'Zone d’intervention peu claire',
    'Avis demandés de façon irrégulière',
  ],
  after: [
    'Offres faciles à comparer',
    'Demande structurée',
    'Informations recueillies dès le départ',
    'Parcours cohérent',
    'Suivi après la prestation',
  ],
} as const;

/** Méthode de travail présentée sur l'accueil. Version courte de docs/01, §4. */
export const method = [
  {
    number: '01',
    title: 'Comprendre',
    body: 'Nous analysons vos services, vos clients, votre zone et votre fonctionnement actuel.',
  },
  {
    number: '02',
    title: 'Clarifier',
    body: 'Nous simplifions ce que vous vendez et la manière dont un client le comprend.',
  },
  {
    number: '03',
    title: 'Construire',
    body: 'Nous mettons en place le parcours adapté à votre activité.',
  },
  {
    number: '04',
    title: 'Améliorer',
    body: 'Nous observons les points de friction et faisons évoluer ce qui doit l’être.',
  },
] as const;

/**
 * Réassurance du bloc de clôture.
 * Trois faits tenables : aucun délai, aucune gratuité chiffrée, aucune
 * disponibilité limitée.
 */
export const reassurance = [
  'Échange sans engagement',
  'Analyse personnalisée',
  'Aucune fausse promesse',
] as const;

/**
 * Réalisation mise en avant sur l'accueil.
 * Les données viennent de `sw-car-cleaning.ts` : une seule source pour
 * l'accueil, la page Réalisations et l'étude de cas.
 */
export const featuredCase = {
  client: swCarCleaning.client,
  sector: swCarCleaning.sector,
  title: swCarCleaning.client,
  summary: swCarCleaning.summary,
  logo: swCarCleaning.logo,
  ctaLabel: 'Voir le projet',
} as const;
