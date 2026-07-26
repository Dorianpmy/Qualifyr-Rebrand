import type { MetadataRoute } from 'next';
import { pageMeta, site, sitemapRoutes } from '@/content/site';

/**
 * Plan du site.
 *
 * Tant que `site.indexable` vaut `false`, le sitemap est **vide** : publier la
 * liste des URL d'un site que l'on demande par ailleurs de ne pas indexer
 * serait contradictoire.
 *
 * Ne contient que les pages publiques. Sont exclues : les routes API, la
 * planche `/design-system` (404 en production) et la page 404 elle-même.
 * Le domaine utilisé est le domaine canonique final.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!site.indexable) return [];

  const lastModified = new Date();

  return sitemapRoutes.map((route) => ({
    url: new URL(route, site.url).toString(),
    lastModified,
    changeFrequency: route === '/' ? 'monthly' : 'yearly',
    priority: pageMeta[route].priority ?? 0.5,
  }));
}
