import type { MetadataRoute } from 'next';
import { getPublishedArticles } from '@/content/blog';
import { pageMeta, site, sitemapRoutes } from '@/content/site';

export const revalidate = 3600;

/**
 * Plan du site.
 *
 * Tant que `site.indexable` vaut `false`, le sitemap est **vide**.
 * Ne contient que les pages publiques.
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

  return [...pages, ...articles];
}
