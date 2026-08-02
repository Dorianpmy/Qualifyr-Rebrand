import type { Metadata } from 'next';
import { ArticleCard } from '@/components/editorial/ArticleCard';
import { CallToAction } from '@/components/editorial/CallToAction';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { ButtonLink } from '@/components/ui/Button';
import { blogArticles, blogIntro, getPublishedArticles } from '@/content/blog';
import { buildMetadata } from '@/lib/metadata';
import { blogIndex, webPage } from '@/lib/structured-data';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/blog');
export const revalidate = 3600;

export default function BlogPage() {
  const articles = getPublishedArticles();
  const featured = articles[0];
  const previous = articles.slice(1);
  const scheduledCount = blogArticles.length - articles.length;

  return (
    <>
      <JsonLd data={webPage('/blog')} />
      <JsonLd data={blogIndex(articles)} />

      <Section spacing="tight" ruled>
        <Container>
          <div className={styles.hero}>
            <SectionHeading
              level={1}
              eyebrow={blogIntro.eyebrow}
              title={blogIntro.title}
              lead={blogIntro.body}
            />
            <p className={styles.edition}>
              Édition {String(articles.length).padStart(2, '0')}
              {scheduledCount > 0 ? ' · Prochain article programmé' : ''}
            </p>
          </div>
        </Container>
      </Section>

      <Section surface="raised" spacing="tight" ruled>
        <Container>
          {featured ? (
            <ArticleCard article={featured} featured headingLevel="h2" />
          ) : (
            <p className={styles.empty}>Le premier article est en préparation.</p>
          )}
        </Container>
      </Section>

      {previous.length > 0 ? (
        <Section spacing="tight" ruled>
          <Container>
            <div className={styles.listHeader}>
              <p>Publications précédentes</p>
              <p>{previous.length} article{previous.length > 1 ? 's' : ''}</p>
            </div>
            <div className={styles.grid}>
              {previous.map((article) => (
                <ArticleCard key={article.slug} article={article} headingLevel="h2" />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <Section spacing="tight">
        <Container>
          <CallToAction
            eyebrow="Votre activité"
            title="Un sujet vous concerne directement ?"
            actionLabel="Faire le diagnostic"
            light
            secondaryAction={(
              <ButtonLink href="/contact" variant="secondary" withArrow>
                Nous contacter
              </ButtonLink>
            )}
          >
            <p>
              Présentez-nous votre situation. Nous regarderons ce qui doit être clarifié
              avant de parler de solution.
            </p>
          </CallToAction>
        </Container>
      </Section>
    </>
  );
}
