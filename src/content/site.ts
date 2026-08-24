import type { Route } from '@/types';

export const productionUrl = 'https://qualifyragence.com';
export const productionDomain = 'qualifyragence.com';

/**
 * Snippet Google principal.
 * Repositionnement SaaS-first (17/08/2026) : Qualifyr est présenté comme le
 * SaaS pour laveurs auto et detailing automobile, pas comme une agence de
 * création de sites. La création de site reste une fonctionnalité de la
 * plateforme, jamais l'activité principale affichée ici.
 * Zéro mention d'un autre secteur ou d'une activité généraliste.
 */
export const homeSeo = {
  title: 'SaaS pour laveur auto et detailing automobile | Qualifyr',
  description:
    'Qualifyr est le SaaS dédié aux laveurs auto : demandes de devis, réservations, prospects, clients et présence en ligne réunis au même endroit.',
} as const;

export const site = {
  url: productionUrl,
  locale: 'fr-FR',
  lang: 'fr',
  indexable: process.env.NEXT_PUBLIC_SITE_INDEXABLE === 'true',
} as const;

type PageMeta = {
  readonly title: string;
  readonly description: string;
  readonly excludeFromSitemap?: boolean;
  readonly priority?: number;
};

export const pageMeta: Readonly<Record<Route, PageMeta>> = {
  '/': {
    title: homeSeo.title,
    description: homeSeo.description,
    priority: 1,
  },
  '/creation-site-web': {
    title: 'Création de site pour laveurs auto à domicile — Qualifyr',
    description:
      'Site pensé pour convertir : formules lisibles, tarifs visibles, prise de contact simple. Pour les laveurs auto à domicile qui veulent plus de demandes.',
    priority: 0.9,
  },
  '/nettoyage-automobile': {
    title: 'Site pour laveurs auto à domicile — plus de réservations',
    description:
      'Prestations claires, tarifs par véhicule, réservation simple. Pour les laveurs auto qui veulent moins de messages Instagram et plus de rendez-vous.',
    priority: 0.9,
  },
  '/tarifs': {
    title: 'Tarifs du logiciel pour laveurs auto | Qualifyr',
    description:
      'Découvrez les tarifs et fonctionnalités des offres Qualifyr, le SaaS spécialisé pour les laveurs auto et detailers.',
    priority: 0.9,
  },
  '/fonctionnalites': {
    title: 'Fonctionnalités du SaaS pour laveurs auto | Qualifyr',
    description:
      'Découvrez les fonctionnalités Qualifyr pour gérer votre activité de lavage auto, vos prospects, vos clients, vos demandes et vos réservations.',
    priority: 0.9,
  },
  '/logiciel-laveur-auto': {
    title: 'Logiciel pour laveur auto : devis, réservations et clients | Qualifyr',
    description:
      'Un logiciel conçu pour les laveurs auto afin de gérer les demandes, les réservations, les prospects et les clients plus facilement.',
    priority: 0.9,
  },
  '/logiciel-detailing-automobile': {
    title: 'Logiciel pour detailing automobile et lavage mobile | Qualifyr',
    /*
     * Reformulée le 18/08/2026 (audit copywriting sitewide) : « Développez
     * votre activité... avec un SaaS conçu pour » ne disait rien de
     * concret — remplacée par la même structure factuelle que la
     * description de `/logiciel-laveur-auto` juste au-dessus. Mots-clés et
     * intention de recherche inchangés (« detailing automobile », « lavage
     * mobile », « SaaS », gestion des demandes/clients).
     */
    description:
      'Un SaaS conçu pour le detailing automobile et le lavage mobile : gérez vos demandes, vos réservations et vos clients depuis un seul outil.',
    priority: 0.9,
  },
  '/methode': {
    title: 'Méthode Qualifyr — de l’offre floue à la demande qualifiée',
    description:
      'Comprendre, clarifier, concevoir, améliorer. Comment nous transformons un savoir-faire de lavage auto en parcours de réservation.',
    priority: 0.9,
  },
  '/realisations': {
    title: 'Réalisations — sites pour laveurs auto | Qualifyr',
    description:
      'Projets publiés : structure de l’offre, identité et parcours de contact pour le lavage auto mobile.',
    priority: 0.8,
  },
  '/a-propos': {
    title: 'À propos — agence pour laveurs auto | Qualifyr',
    description:
      'Pourquoi Qualifyr se concentre sur le nettoyage automobile à domicile, et ce que nous refusons de faire.',
    priority: 0.6,
  },
  '/estimation': {
    title: 'Estimation budget site laveur auto — Qualifyr',
    description:
      'Orientation claire et fourchette de budget indicative en quelques minutes, avant le premier échange.',
    priority: 0.8,
  },
  '/contact': {
    title: 'Contact — Qualifyr Agence',
    description:
      'Une question sur le lavage auto, un site ou l’outil de réservation ? Écrivez-nous directement, nous vous répondons rapidement.',
    priority: 0.5,
  },
  '/faq': {
    title: 'FAQ SaaS pour laveurs auto et detailers | Qualifyr',
    description:
      'Toutes les réponses sur Qualifyr, le logiciel de gestion et de conversion dédié aux laveurs auto et professionnels du detailing.',
    priority: 0.7,
  },
  '/blog': {
    title: 'Journal laveurs auto — conseils pour remplir l’agenda | Qualifyr',
    description:
      'Offre, Google, parcours de réservation : articles concrets pour développer une activité de lavage auto.',
    priority: 0.7,
  },
  '/mentions-legales': {
    title: 'Mentions légales — Qualifyr',
    description:
      'Éditeur, publication et hébergement du site Qualifyr Agence.',
    priority: 0.2,
  },
  '/politique-de-confidentialite': {
    title: 'Politique de confidentialité — Qualifyr',
    description:
      'Données des formulaires, finalité, conservation, droits. Transparence sur le traitement.',
    priority: 0.2,
  },
  '/conditions-generales-de-vente': {
    title: 'Conditions générales de vente — Qualifyr',
    description:
      'Offres, prix, durée, résiliation, défaut de paiement et limites du service.',
    priority: 0.2,
  },
};

export const sitemapRoutes = (Object.keys(pageMeta) as Route[]).filter(
  (route) => pageMeta[route].excludeFromSitemap !== true,
);
