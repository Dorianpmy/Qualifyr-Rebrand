import type { Route } from '@/types';

export const productionUrl = 'https://qualifyragence.com';
export const productionDomain = 'qualifyragence.com';

export const homeSeo = {
  title: 'Qualifyr — Sites web pour nettoyage automobile et detailing',
  description:
    'Agence spécialisée dans le nettoyage automobile et le detailing. Nous concevons les sites qui présentent vos formules, affichent vos tarifs et remplissent votre agenda.',
} as const;

/**
 * Configuration du site et métadonnées par page.
 *
 * `indexable` reste à `false` tant que la variable de production explicite
 * n'est pas activée : les aperçus de préproduction ne doivent pas être indexés.
 */
export const site = {
  /** Domaine canonique public. */
  url: productionUrl,
  locale: 'fr-FR',
  lang: 'fr',
  indexable: process.env.NEXT_PUBLIC_SITE_INDEXABLE === 'true',
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
 * Recentrées 100 % sur le nettoyage automobile / detailing.
 */
export const pageMeta: Readonly<Record<Route, PageMeta>> = {
  '/': {
    title: homeSeo.title,
    description: homeSeo.description,
    priority: 1,
  },
  '/creation-site-web': {
    title: 'Création de site internet pour entreprise de services — Qualifyr',
    description:
      'Un site pensé pour convertir : offre lisible, preuves de sérieux et parcours de contact simple. Pour les entreprises de services qui veulent plus de demandes.',
    priority: 0.9,
  },
  '/nettoyage-automobile': {
    title: 'Site pour detailing et nettoyage auto — plus de réservations',
    description:
      'Vos prestations présentées clairement, vos tarifs par type de véhicule et une prise de rendez-vous simple. Pour les detailers qui veulent moins de DM et plus de RDV.',
    priority: 0.9,
  },
  '/tarifs': {
    title: 'Tarifs — création de site pour detailing | Qualifyr',
    description:
      'Nos fourchettes de prix, affichées : site vitrine et site avec parcours de demande. Pas de devis à rallonge.',
    priority: 0.9,
  },
  '/methode': {
    title: 'Notre méthode — du premier contact à la demande qualifiée',
    description:
      'Comprendre, clarifier, concevoir, améliorer. La méthode Qualifyr pour transformer un savoir-faire en un parcours que vos prospects comprennent et suivent.',
    priority: 0.9,
  },
  '/realisations': {
    title: 'Réalisations — sites pour nettoyage auto et detailing',
    description:
      'Les projets conçus par Qualifyr : structure de l’offre, identité et parcours de contact. Des exemples concrets de ce que change un site bien pensé.',
    priority: 0.8,
  },
  '/realisations/sw-car-cleaning': {
    title: 'SW Car Cleaning, detailing à Fribourg — étude de cas Qualifyr',
    description:
      'Comment nous avons clarifié les formules, construit l’identité et simplifié la prise de contact d’un service de lavage et detailing à domicile à Fribourg.',
    priority: 0.7,
  },
  '/a-propos': {
    title: 'À propos — l’agence du detailing et du nettoyage auto | Qualifyr',
    description:
      'Une verticale, une méthode, et ce que nous refusons de faire. Pourquoi Qualifyr se concentre sur le nettoyage automobile et le detailing.',
    priority: 0.6,
  },
  '/diagnostic': {
    title: 'Diagnostic gratuit de votre présence en ligne — Qualifyr',
    description:
      'Décrivez votre activité et vos priorités. Nous identifions ce qui freine vos demandes entrantes, et ce qu’il faut corriger en premier.',
    priority: 0.9,
  },
  '/estimation': {
    title: 'Estimation de votre projet de site — Qualifyr',
    description:
      'Obtenez une orientation claire et une fourchette de budget indicative en quelques minutes, avant même le premier échange.',
    priority: 0.8,
  },
  '/contact': {
    title: 'Contact — Qualifyr',
    description:
      'Une question sur notre façon de travailler ou sur votre situation en particulier ? Écrivez-nous. Pour une analyse détaillée, passez par le diagnostic.',
    priority: 0.5,
  },
  '/blog': {
    title: 'Le journal — conseils pour detailers et nettoyage auto | Qualifyr',
    description:
      'Remplir son agenda, clarifier son offre, être trouvé sur Google : des articles concrets pour développer une activité de detailing.',
    priority: 0.7,
  },
  '/mentions-legales': {
    title: 'Mentions légales — Qualifyr',
    description:
      'Consultez les informations relatives à l’éditeur, à la publication et à l’hébergement du site officiel de Qualifyr Agence.',
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
