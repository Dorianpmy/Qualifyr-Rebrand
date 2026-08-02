import { describe, expect, it } from 'vitest';
import {
  blogArticles,
  getPublishedArticleBySlug,
  getPublishedArticles,
  readingTime,
} from '@/content/blog';

describe('calendrier éditorial', () => {
  it('ne rend pas un article accessible avant sa date', () => {
    const now = new Date('2026-07-31T07:30:00+02:00');

    expect(getPublishedArticles(now)).toHaveLength(0);
    expect(
      getPublishedArticleBySlug(
        'rendre-une-offre-de-services-plus-facile-a-choisir',
        now,
      ),
    ).toBeUndefined();
  });

  it('publie les articles dans l’ordre antéchronologique', () => {
    const now = new Date('2026-07-31T12:00:00+02:00');
    const published = getPublishedArticles(now);

    expect(published).toHaveLength(3);
    expect(published.map((article) => article.number)).toEqual(['01', '02', '03']);
  });

  it('rend chaque article futur visible le jour prévu', () => {
    const now = new Date('2026-08-04T09:00:00+02:00');

    expect(getPublishedArticles(now)).toHaveLength(blogArticles.length);
    expect(
      getPublishedArticleBySlug('afficher-ses-prix-sur-un-site-de-services', now),
    ).toBeDefined();
  });

  it('calcule un temps de lecture positif à partir du contenu réel', () => {
    for (const article of blogArticles) {
      expect(readingTime(article)).toBeGreaterThanOrEqual(1);
    }
  });
});
