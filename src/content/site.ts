import type { Route } from '@/types';

export const productionUrl = 'https://qualifyragence.com';
export const productionDomain = 'qualifyragence.com';

/**
 * Snippet Google principal.
 * Titre ~55–60 car. Description ~150–160 car.
 * Zéro mention conciergerie / Airbnb.
 */
export const homeSeo = {
  title: 'Qualifyr — Sites & réservation pour detailers',
  description:
    'Agence et outil pour le detailing auto en France et en Suisse. Sites clairs, formules visibles, parcours de réservation — moins de DM, plus de RDV.',
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
    title: 'Création de site pour detailers et nettoyage auto — Qualifyr',
    description:
      'Site pensé pour convertir : formules lisibles, tarifs visibles, prise de contact simple. Pour les professionnels du detailing qui veulent plus de demandes.',
    priority: 0.9,
  },
  '/nettoyage-automobile': {
    title: 'Site pour detailing et nettoyage auto — plus de réservations',
    description:
      'Prestations claires, tarifs par véhicule, réservation simple. Pour les detailers qui veulent moins de messages Instagram et plus de rendez-vous.',
    priority: 0.9,
  },
  '/tarifs': {
    title: 'Tarifs — site pour detailing | Qualifyr',
    description:
      'Fourchettes affichées : site vitrine et site avec parcours de demande. Transparence avant le premier appel.',
    priority: 0.9,
  },
  '/methode': {
    title: 'Méthode Qualifyr — de l’offre floue à la demande qualifiée',
    description:
      'Comprendre, clarifier, concevoir, améliorer. Comment nous transformons un savoir-faire detailing en parcours de réservation.',
    priority: 0.9,
  },
  '/realisations': {
    title: 'Réalisations — sites detailing et nettoyage auto | Qualifyr',
    description:
      'Projets publiés : structure de l’offre, identité et parcours de contact pour le detailing mobile.',
    priority: 0.8,
  },
  '/realisations/sw-car-cleaning': {
    title: 'SW Car Cleaning (Fribourg) — étude de cas detailing | Qualifyr',
    description:
      'Clarification des formules, identité et prise de contact pour un service de lavage et detailing à domicile à Fribourg.',
    priority: 0.7,
  },
  '/a-propos': {
    title: 'À propos — agence detailing France & Suisse | Qualifyr',
    description:
      'Pourquoi Qualifyr se concentre sur le nettoyage automobile et le detailing, et ce que nous refusons de faire.',
    priority: 0.6,
  },
  '/diagnostic': {
    title: 'Diagnostic gratuit — ce qui freine vos réservations detailing',
    description:
      'Décrivez votre activité. Nous identifions ce qui bloque les demandes : offre, tarifs, parcours mobile.',
    priority: 0.9,
  },
  '/estimation': {
    title: 'Estimation budget site detailing — Qualifyr',
    description:
      'Orientation claire et fourchette de budget indicative en quelques minutes, avant le premier échange.',
    priority: 0.8,
  },
  '/contact': {
    title: 'Contact — Qualifyr Agence',
    description:
      'Une question sur le detailing, un site ou l’outil de réservation ? Écrivez-nous. Pour une analyse, passez par le diagnostic.',
    priority: 0.5,
  },
  '/blog': {
    title: 'Journal detailing — conseils pour remplir l’agenda | Qualifyr',
    description:
      'Offre, Google, parcours de réservation : articles concrets pour développer une activité de detailing.',
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
};

export const sitemapRoutes = (Object.keys(pageMeta) as Route[]).filter(
  (route) => pageMeta[route].excludeFromSitemap !== true,
);
