import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { CallToAction } from '@/components/editorial/CallToAction';
import { EditorialCard } from '@/components/editorial/EditorialCard';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { QuoteBlock } from '@/components/editorial/QuoteBlock';

import { aboutIntro, aboutPage, howWeWork, philosophy, refusals } from '@/content/about';
import { buildMetadata } from '@/lib/metadata';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/a-propos');

/**
 * Page À propos.
 *
 * Aucune histoire de fondateur n'est racontée : ni date de création, ni
 * anecdote d'origine, ni parcours personnel, tant que Dorian ne les a pas
 * fournis et validés. La page parle de la façon de travailler — vraie et
 * vérifiable — plutôt que d'une biographie qui ne l'est pas.
 */
export default function AProposPage() {
  return (
    <>
      <Section spacing="tight">
        <Container>
          <SectionHeading
            level={1}
            split
            eyebrow={aboutPage.eyebrow}
            title={aboutPage.title}
            lead={aboutPage.lead}
          />
          <div className={styles.intro}>
            {aboutIntro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Container>
      </Section>

      <Section surface="raised" ruled>
        <Container>
          <SectionHeading eyebrow="Philosophie" title="Ce à quoi nous tenons." />
          <div className={styles.philosophy}>
            {philosophy.map((principle) => (
              <article key={principle.number} className={styles.principle}>
                <span className={styles.principleNumber}>{principle.number}</span>
                <h3 className={styles.principleTitle}>{principle.title}</h3>
                <p className={styles.principleBody}>{principle.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <QuoteBlock centered>
            Un parcours que vous ne maîtrisez pas devient une dépendance, pas un atout.
          </QuoteBlock>
        </Container>
      </Section>

      <Section surface="sunken" spacing="tight">
        <Container>
          <SectionHeading eyebrow="Manière de travailler" title="Comment cela se passe." />
          <div className={styles.ways}>
            {howWeWork.map((item) => (
              <EditorialCard key={item.title} title={item.title}>
                {item.body}
              </EditorialCard>
            ))}
          </div>
        </Container>
      </Section>

      <Section surface="inverse">
        <Container>
          <div className={styles.refusalsLayout}>
            <SectionHeading
              inverse
              eyebrow="Nos limites"
              title="Ce que nous ne faisons pas."
            />
            <div className={styles.refusals}>
              {refusals.map((item) => (
                <article key={item.title} className={styles.refusal}>
                  <h3 className={styles.refusalTitle}>{item.title}</h3>
                  <p className={styles.refusalBody}>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section surface="raised" ruled>
        <Container>
          <CallToAction
            light
            eyebrow="Prendre contact"
            title="Dites-nous où vous en êtes."
          >
            Votre activité, votre zone, vos prestations, et ce qui vous freine aujourd’hui.
            Nous vous dirons franchement ce qui mérite d’être clarifié en premier.
          </CallToAction>
        </Container>
      </Section>
    </>
  );
}
