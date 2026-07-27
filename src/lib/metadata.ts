import type { Metadata } from 'next';
import { brand } from '@/content/brand';
import { pageMeta, site } from '@/content/site';
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
  url: '/images/og/qualifyr-og-v2.png',
  width: 1200,
  height: 630,
  alt: 'Qualifyr — Agence digitale pour les entreprises de services',
  type: 'image/png',
} as const;

export function buildMetadata(route: Route): Metadata {
  const meta = pageMeta[route];
  const canonical = new URL(route, site.url).toString();

  return {
    // Titre pris tel quel : la marque y figure déjà, le gabarit ne s'applique pas.
    title: { absolute: meta.title },
    description: meta.description,
    alternates: { canonical: new URL(canonical) },
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
