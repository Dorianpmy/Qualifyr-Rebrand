import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CallToAction } from '@/components/editorial/CallToAction';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { ButtonLink } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';
import {
  formatArticleDate,
  getPublishedArticleBySlug,
  readingTime,
} from '@/content/blog';
import { buildArticleMetadata } from '@/lib/metadata';
import { blogPosting } from '@/lib/structured-data';
import styles from './page.module.css';

type ArticlePageProps = {
  readonly params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getPublishedArticleBySlug(slug);

  if (!article) notFound();

  return buildArticleMetadata(article);
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getPublishedArticleBySlug(slug);

  if (!article) notFound();

  return (
    <>
      <JsonLd data={blogPosting(article)} />

      <article>
        <Section spacing="tight" ruled>
          <Container width="reading">
            <div className={styles.backLink}>
              <TextLink href="/blog" tone="quiet">← Retour au journal</TextLink>
            </div>
            <div className={styles.header}>
              <p className={styles.meta}>
                <span>{article.category}</span>
                <time dateTime={article.publishedAt}>{formatArticleDate(article)}</time>
                <span>{readingTime(article)} min de lecture</span>
              </p>
              <h1>{article.title}</h1>
              <p className={styles.excerpt}>{article.excerpt}</p>
            </div>
          </Container>
        </Section>

        <Section surface="raised" spacing="tight" ruled>
          <Container width="reading">
            <div className={styles.body}>
              <p className={styles.introduction}>{article.introduction}</p>

              {article.sections.map((section, index) => (
                <section key={section.title} className={styles.articleSection}>
                  <p className={styles.sectionNumber} aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.points ? (
                    <ul>
                      {section.points.map((point) => <li key={point}>{point}</li>)}
                    </ul>
                  ) : null}
                </section>
              ))}

              <aside className={styles.conclusion} aria-label="À retenir">
                <p>À retenir</p>
                <p>{article.conclusion}</p>
              </aside>
            </div>
          </Container>
        </Section>
      </article>

      <Section spacing="tight">
        <Container>
          <CallToAction
            eyebrow="Passer au concret"
            title="Clarifions ce qui freine votre parcours aujourd’hui."
            actionLabel="Faire le diagnostic"
            light
            secondaryAction={(
              <ButtonLink href="/blog" variant="secondary" withArrow>
                Lire les autres articles
              </ButtonLink>
            )}
          >
            <p>
              Quelques questions suffisent pour comprendre votre situation et préparer un
              échange utile.
            </p>
          </CallToAction>
        </Container>
      </Section>
    </>
  );
}
