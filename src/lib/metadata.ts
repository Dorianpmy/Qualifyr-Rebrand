import type { Metadata } from 'next';
import { brand } from '@/content/brand';
import type { BlogArticle } from '@/content/blog';
import { homeSeo, pageMeta, site } from '@/content/site';
import type { Route } from '@/types';

/**
 * Construction des métadonnées d'une page à partir de `src/content/site.ts`.
 *
 * Tant que `site.indexable` vaut `false`, **toutes** les pages sont en
 * `noindex, nofollow` : un aperçu de préproduction ne doit jamais être
 * référencé, ni apparaître dans un résultat de recherche.
 */

/** Image de partage : composition originale, ivoire, charbon et laiton. */
export const openGraphImage = {
  url: '/images/og/qualifyr-og-v3.png',
  width: 1200,
  height: 630,
  alt: homeSeo.title,
  type: 'image/png',
} as const;

export function buildMetadata(route: Route): Metadata {
  const meta = pageMeta[route];
  const canonical = new URL(route, site.url).toString();

  return {
    // Titre pris tel quel : la marque y figure déjà, le gabarit ne s'applique pas.
    title: { absolute: meta.title },
    description: meta.description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: site.locale,
      siteName: brand.fullName,
      title: meta.title,
      description: meta.description,
      url: canonical,
      images: [openGraphImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [openGraphImage.url],
    },
    robots: site.indexable
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
  };
}

export function buildArticleMetadata(article: BlogArticle): Metadata {
  const canonical = new URL(`/blog/${article.slug}`, site.url).toString();

  return {
    title: { absolute: article.seoTitle },
    description: article.seoDescription,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      locale: site.locale,
      siteName: brand.fullName,
      title: article.seoTitle,
      description: article.seoDescription,
      url: canonical,
      publishedTime: article.publishedAt,
      authors: [brand.fullName],
      images: [openGraphImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seoTitle,
      description: article.seoDescription,
      images: [openGraphImage.url],
    },
    robots: site.indexable
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
  };
}
