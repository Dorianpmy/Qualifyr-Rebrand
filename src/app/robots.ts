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

  const disallow = ['/api/', '/design-system', '/go/', '/app/', '/reservation/'];

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
