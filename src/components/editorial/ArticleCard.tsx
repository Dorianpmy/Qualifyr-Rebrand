import Link from 'next/link';
import type { BlogArticle } from '@/content/blog';
import { formatArticleDate, readingTime } from '@/content/blog';
import styles from './ArticleCard.module.css';

type ArticleCardProps = {
  readonly article: BlogArticle;
  readonly featured?: boolean;
  readonly compact?: boolean;
  readonly headingLevel?: 'h2' | 'h3';
};

export function ArticleCard({
  article,
  featured = false,
  compact = false,
  headingLevel = 'h3',
}: ArticleCardProps) {
  const Heading = headingLevel;
  const classNames = [
    styles.card,
    featured ? styles.featured : '',
    compact ? styles.compact : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link
      href={`/blog/${article.slug}`}
      className={classNames}
      aria-label={`Lire l’article : ${article.title}`}
    >
      <span className={styles.visual} aria-hidden="true">
        <span className={styles.issue}>Nº {article.number}</span>
        <span className={styles.monogram}>{article.number}</span>
        <span className={styles.visualCategory}>{article.category}</span>
      </span>
      <span className={styles.content}>
        <span className={styles.meta}>
          <span>{article.category}</span>
          <time dateTime={article.publishedAt}>{formatArticleDate(article)}</time>
          <span>{readingTime(article)} min</span>
        </span>
        <Heading className={styles.title}>{article.title}</Heading>
        {!compact ? <span className={styles.excerpt}>{article.excerpt}</span> : null}
        <span className={styles.readMore} aria-hidden="true">
          Lire l’article <span>→</span>
        </span>
      </span>
    </Link>
  );
}
