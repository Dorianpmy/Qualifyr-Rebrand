import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { CallToAction } from '@/components/editorial/CallToAction';
import { CasePlate } from '@/components/editorial/CasePlate';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { ButtonLink } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';

import { caseStudies, workPage } from '@/content/work';
import { buildMetadata } from '@/lib/metadata';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/realisations');

/**
 * Page Réalisations.
 *
 * Une entrée par bande pleine largeur, numérotée. La structure accepte
 * d'autres projets sans changer de mise en page : il n'y a pas de grille à
 * remplir, donc pas de case vide à combler avec un projet fictif.
 *
 * Les entrées viennent de `src/content/work.ts`. Aucun résultat chiffré,
 * aucune capture d'écran fabriquée.
 */
export default function RealisationsPage() {
  return (
    <>
      <Section spacing="tight">
        <Container>
          <SectionHeading
            level={1}
            split
            eyebrow={workPage.eyebrow}
            title={workPage.title}
            lead={workPage.lead}
          />

          <div className={styles.list}>
            {caseStudies.map((study, index) => (
              <article key={study.slug} className={styles.entry}>
                <p className={styles.entryIndex}>
                  <span className={styles.entryNumber}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{study.sector}</span>
                </p>

                <CasePlate
                  client={study.client}
                  meta={study.sector}
                  logo={study.logo}
                  tone="sand"
                  priority={index === 0}
                />

                <div className={styles.entryBody}>
                  <h2 className={styles.entryTitle}>{study.title}</h2>
                  <p className={styles.entrySummary}>{study.summary}</p>
                  <ul className={styles.deliverables}>
                    {study.deliverables.map((item) => (
                      <li key={item} className={styles.deliverable}>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className={styles.entryAction}>
                    <ButtonLink href={study.href} variant="secondary">
                      Voir le projet
                    </ButtonLink>
                  </p>
                </div>
              </article>
            ))}
          </div>

          <p className={styles.note}>
            D’autres réalisations seront ajoutées au fil des projets. En attendant, la{' '}
            <TextLink href="/methode">méthode</TextLink> décrit précisément la façon dont
            chacun est construit.
          </p>
        </Container>
      </Section>

      <Section surface="inverse">
        <Container>
          <CallToAction
            eyebrow="Votre projet"
            title="Le prochain parcours pourrait être le vôtre."
          >
            Décrivez-nous votre activité, votre zone et vos prestations. Nous verrons ensemble
            ce qui mérite d’être clarifié en premier.
          </CallToAction>
        </Container>
      </Section>
    </>
  );
}
