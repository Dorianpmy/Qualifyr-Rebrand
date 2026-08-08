import type { Route } from '@/types';

export const productionUrl = 'https://qualifyragence.com';
export const productionDomain = 'qualifyragence.com';

export const homeSeo = {
  title: 'Qualifyr | Création de sites web et applications sur mesure',
  description:
    'Qualifyr conçoit des sites web, des applications et des solutions digitales sur mesure pour aider les entreprises à gagner en clarté, en efficacité et en clients.',
} as const;

/**
 * Configuration du site et métadonnées par page.
 *
 * `indexable` reste à `false` tant que la variable de production explicite
 * n'est pas activée : les aperçus de préproduction ne doivent pas être indexés. Il
 * commande à la fois les balises `robots` de chaque page, `robots.txt` et le
 * `sitemap.xml`. Un seul interrupteur, actionné le jour de la mise en ligne.
 */
export const site = {
  /** Domaine canonique public. Les previews pointent elles aussi vers ce domaine. */
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
 *
 * Titres et descriptions **uniques**, rédigés à la main, sans répétition
 * artificielle de mots-clés. Les intentions visées sont B2B et portent sur le
 * développement des deux verticales officielles. Elles sont servies par le
 * contenu réel des pages, pas par une accumulation de termes.
 */
export const pageMeta: Readonly<Record<Route, PageMeta>> = {
  '/': {
    title: homeSeo.title,
    description: homeSeo.description,
    priority: 1,
  },
  '/creation-site-web': {
    title: 'Création de site web sur mesure — Qualifyr',
    description:
      'Qualifyr conçoit des sites web clairs, rapides et adaptés aux besoins réels des entreprises, de la structure des contenus jusqu’à la prise de contact.',
    priority: 0.9,
  },
  '/nettoyage-automobile': {
    title: 'Création de site pour nettoyage auto et detailing | Qualifyr',
    description:
      'Qualifyr crée des sites internet pour le nettoyage automobile mobile et le detailing, afin de clarifier les offres et faciliter la prise de rendez-vous.',
    priority: 0.9,
  },
  '/conciergerie': {
    title: 'Création de site internet pour conciergerie | Qualifyr',
    description:
      'Qualifyr crée des sites internet pour les conciergeries afin de présenter leurs services, rassurer leurs prospects et mieux qualifier chaque demande.',
    priority: 0.9,
  },
  '/methode': {
    title: 'Parcours client pour entreprises de services — Qualifyr',
    description:
      'Découvrez comment Qualifyr structure le parcours client des entreprises de nettoyage automobile mobile et des conciergeries, de la découverte à la recommandation.',
    priority: 0.9,
  },
  '/realisations': {
    title: 'Sites pour nettoyage automobile et conciergeries — Qualifyr',
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
  '/laboratoire': {
    title: 'Laboratoire créatif — Qualifyr',
    description:
      'Explorez les études créatives de Qualifyr autour de la conciergerie, de l’identité visuelle et du mouvement, clairement distinguées des projets clients.',
    priority: 0.5,
  },
  '/a-propos': {
    title: 'Agence spécialisée nettoyage auto et conciergeries — Qualifyr',
    description:
      'Une agence dédiée à deux verticales : le nettoyage automobile mobile et les conciergeries. Notre façon de travailler, et ce que nous refusons de faire.',
    priority: 0.6,
  },
  '/diagnostic': {
    title: 'Diagnostic de votre projet | Qualifyr',
    description:
      'Présentez votre activité, vos priorités et votre projet afin de préparer un échange plus concret avec Qualifyr.',
    priority: 0.9,
  },
  '/estimation': {
    title: 'Estimation de projet | Qualifyr',
    description:
      'Obtenez une première orientation et une estimation indicative avant un échange avec Qualifyr.',
    priority: 0.8,
  },
  '/contact': {
    title: 'Contact — Qualifyr',
    description:
      'Une question sur notre façon de travailler ou sur votre situation en particulier ? Écrivez-nous. Pour une analyse détaillée, passez par le diagnostic.',
    priority: 0.5,
  },
  '/blog': {
    title: 'Le journal — Conseils pour entreprises de services | Qualifyr',
    description:
      'Des articles concrets pour clarifier une offre, construire une identité, concevoir un site utile et simplifier la prise de contact.',
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
