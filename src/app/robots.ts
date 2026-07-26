import type { MetadataRoute } from 'next';
import { site } from '@/content/site';

/**
 * `robots.txt`.
 *
 * Deux états, commandés par le seul interrupteur `site.indexable` :
 *
 * — **Avant la mise en ligne** (état actuel) : tout est interdit. Le site vit
 *   sur une URL d'aperçu, qui ne doit apparaître dans aucun index. Un aperçu
 *   indexé crée du contenu dupliqué et des liens morts après la bascule.
 * — **Après la mise en ligne** : les pages publiques sont autorisées, les
 *   routes techniques exclues, et le sitemap déclaré sur le domaine canonique.
 */
export default function robots(): MetadataRoute.Robots {
  if (!site.indexable) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/design-system'],
      },
    ],
    sitemap: new URL('/sitemap.xml', site.url).toString(),
    host: site.url,
  };
}
