import type { MetadataRoute } from 'next';
import { site } from '@/content/site';

/**
 * robots.txt — indexation uniquement si NEXT_PUBLIC_SITE_INDEXABLE=true.
 * SaaS (/app, /reservation) exclu du crawl sur le domaine marketing.
 */
export default function robots(): MetadataRoute.Robots {
  if (!site.indexable) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  /* `/desinscription/` ajouté le 22/08/2026 avec la prospection sortante.
     Chaque adresse de cette famille contient un jeton unique lié à un
     destinataire ; les laisser explorer reviendrait à faire désinscrire des
     gens par un robot d'indexation, et à exposer les jetons dans un index
     public. La page porte déjà `noindex`, mais un `Disallow` empêche la
     visite elle-même, ce que `noindex` ne fait pas. */
  const disallow = [
    '/api/',
    '/design-system',
    '/go/',
    '/app/',
    '/reservation/',
    '/desinscription/',
  ];

  return {
    rules: [
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow,
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow,
      },
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
    ],
    sitemap: new URL('/sitemap.xml', site.url).toString(),
    host: site.url,
  };
}
