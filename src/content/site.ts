import type { Route } from '@/types';

export const productionUrl = 'https://qualifyragence.com';
export const productionDomain = 'qualifyragence.com';

export const homeSeo = {
  title: 'Qualifyr — Sites web pour conciergeries et nettoyage auto',
  description:
    'Agence spécialisée dans deux métiers : conciergerie et nettoyage automobile. Nous concevons les sites qui attirent des propriétaires et remplissent un agenda.',
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
 *
 * **Angle éditorial.** Les intentions sont formulées du côté du problème du
 * prospect, pas du côté de la prestation vendue. Personne ne cherche « création
 * de site pour conciergerie » ; en revanche les gérants cherchent comment
 * signer plus de mandats, et les detailers comment remplir leur agenda. Chaque
 * titre relie donc le livrable au résultat attendu — sans promettre ce que la
 * page ne traite pas réellement.
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
  '/conciergerie': {
    title: 'Site pour conciergerie — attirer et convaincre des propriétaires',
    description:
      'Un site qui rassure les propriétaires, met en avant vos garanties et qualifie chaque demande. Pour les conciergeries qui veulent signer plus de mandats.',
    priority: 0.9,
  },
  '/outil-conciergerie': {
    title: 'Logiciel d’acquisition pour conciergerie — 79 €/mois | Qualifyr',
    description:
      'Une page qui estime les revenus d’un bien, capte les propriétaires intéressés et range chaque demande dans votre tableau de bord. Essai gratuit, sans engagement.',
    priority: 0.9,
  },
  '/tarifs': {
    title: 'Tarifs — création de site et outil pour conciergerie | Qualifyr',
    description:
      'Nos fourchettes de prix, affichées : site vitrine, site avec parcours de demande, et outil d’acquisition à 79 € par mois. Pas de devis à rallonge.',
    priority: 0.9,
  },
  '/methode': {
    title: 'Notre méthode — du premier contact à la demande qualifiée',
    description:
      'Comprendre, clarifier, concevoir, améliorer. La méthode Qualifyr pour transformer un savoir-faire en un parcours que vos prospects comprennent et suivent.',
    priority: 0.9,
  },
  '/realisations': {
    title: 'Réalisations — sites pour conciergeries et nettoyage auto',
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
    title: 'À propos — l’agence des conciergeries et du detailing | Qualifyr',
    description:
      'Deux verticales, une méthode, et ce que nous refusons de faire. Pourquoi Qualifyr ne travaille qu’avec les entreprises de services.',
    priority: 0.6,
  },
  '/diagnostic': {
    title: 'Diagnostic gratuit de votre présence en ligne — Qualifyr',
    description:
      'Décrivez votre activité et vos priorités. Nous identifions ce qui freine vos demandes entrantes, et ce qu’il faut corriger en premier.',
    priority: 0.9,
  },
  '/simulateur-revenus-locatifs': {
    title: 'Simulateur de revenus Airbnb — estimez le potentiel d’un bien',
    description:
      'Estimez en quelques secondes ce qu’un logement peut générer en location courte durée : fourchette annuelle, prix moyen par nuit et revenu net après conciergerie.',
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
    title: 'Le journal — conseils pour conciergeries et detailers | Qualifyr',
    description:
      'Trouver des propriétaires, remplir son agenda, clarifier son offre : des articles concrets pour développer une activité de service.',
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
