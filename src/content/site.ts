import type { Route } from '@/types';

export const productionUrl = 'https://qualifyragence.com';
export const productionDomain = 'qualifyragence.com';

/**
 * Configuration du site et métadonnées par page.
 *
 * `indexable` reste à `false` tant que le domaine de production n'est pas
 * connecté : les aperçus de préproduction ne doivent pas être indexés. Il
 * commande à la fois les balises `robots` de chaque page, `robots.txt` et le
 * `sitemap.xml`. Un seul interrupteur, actionné le jour de la mise en ligne.
 */
export const site = {
  /** Domaine canonique. Repli si `NEXT_PUBLIC_SITE_URL` n'est pas défini. */
  url: process.env.NEXT_PUBLIC_SITE_URL?.trim() || productionUrl,
  locale: 'fr-FR',
  lang: 'fr',
  indexable: false,
} as const;

type PageMeta = {
  /** Titre complet, utilisé tel quel — la marque y est déjà incluse. */
  readonly title: string;
  readonly description: string;
  /** Hors sitemap et en `noindex` même après la mise en ligne. */
  readonly excludeFromSitemap?: boolean;
  /** Priorité relative dans le sitemap. */
  readonly priority?: number;
};

/**
 * Métadonnées par route.
 *
 * Titres et descriptions **uniques**, rédigés à la main, sans répétition
 * artificielle de mots-clés. Les intentions visées sont B2B : développer une
 * entreprise de nettoyage automobile, prise de rendez-vous, réservation
 * detailing, parcours client, visibilité locale. Elles sont servies par le
 * contenu réel des pages, pas par une accumulation de termes.
 */
export const pageMeta: Readonly<Record<Route, PageMeta>> = {
  '/': {
    title: 'Qualifyr — Développez votre activité de nettoyage automobile',
    description:
      'Qualifyr aide les entreprises de nettoyage automobile mobile à être mieux trouvées, plus facilement réservées et davantage recommandées.',
    priority: 1,
  },
  '/methode': {
    title: 'Notre méthode — Qualifyr',
    description:
      'Découvrez comment Qualifyr structure le parcours client des entreprises de nettoyage automobile mobile, de la découverte à la nouvelle réservation.',
    priority: 0.9,
  },
  '/realisations': {
    title: 'Réalisations — Qualifyr',
    description:
      'Découvrez les projets conçus par Qualifyr pour présenter plus clairement une activité de service et faciliter la prise de contact.',
    priority: 0.8,
  },
  '/realisations/sw-car-cleaning': {
    title: 'SW Carcleaning — Réalisation Qualifyr',
    description:
      'Le projet réalisé pour SW Carcleaning, lavage et detailing à domicile à Fribourg : identité, structure des formules et parcours de prise de contact.',
    priority: 0.7,
  },
  '/a-propos': {
    title: 'À propos — Qualifyr',
    description:
      'Une agence dédiée à un seul métier : le nettoyage automobile mobile et le detailing à domicile. Notre façon de travailler, et ce que nous refusons de faire.',
    priority: 0.6,
  },
  '/diagnostic': {
    title: 'Diagnostic activité nettoyage automobile — Qualifyr',
    description:
      'Présentez votre fonctionnement actuel et identifiez les points qui peuvent compliquer la compréhension, la réservation ou la fidélisation.',
    priority: 0.9,
  },
  '/contact': {
    title: 'Contact — Qualifyr',
    description:
      'Une question sur notre façon de travailler ou sur votre situation en particulier ? Écrivez-nous. Pour une analyse détaillée, passez par le diagnostic.',
    priority: 0.5,
  },
  '/mentions-legales': {
    title: 'Mentions légales — Qualifyr',
    description:
      'Informations relatives à l’éditeur et à l’hébergeur du site de Qualifyr Agence, agence spécialisée dans le nettoyage automobile mobile.',
    priority: 0.2,
  },
  '/politique-de-confidentialite': {
    title: 'Politique de confidentialité — Qualifyr',
    description:
      'Données collectées par les formulaires du site, finalité, conservation, destinataires et exercice de vos droits. Aucun cookie, aucune mesure d’audience.',
    priority: 0.2,
  },
};

/** Routes publiques, dans l'ordre du sitemap. */
export const sitemapRoutes = (Object.keys(pageMeta) as Route[]).filter(
  (route) => pageMeta[route].excludeFromSitemap !== true,
);
