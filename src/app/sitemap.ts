import type { MetadataRoute } from 'next';
import { getPublishedArticles } from '@/content/blog';
import { cities } from '@/content/cities';
import { pageMeta, site, sitemapRoutes } from '@/content/site';

export const revalidate = 3600;

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

  const pages: MetadataRoute.Sitemap = sitemapRoutes.map((route) => ({
    url: new URL(route, site.url).toString(),
    lastModified,
    changeFrequency: route === '/blog' ? 'daily' : route === '/' ? 'monthly' : 'yearly',
    priority: pageMeta[route].priority ?? 0.5,
  }));

  const articles: MetadataRoute.Sitemap = getPublishedArticles().map((article) => ({
    url: new URL(`/blog/${article.slug}`, site.url).toString(),
    lastModified: new Date(article.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Pages locales : générées statiquement, déclarées comme les articles.
  const localPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: new URL(`/conciergerie/${city.slug}`, site.url).toString(),
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...pages, ...articles, ...localPages];
}
