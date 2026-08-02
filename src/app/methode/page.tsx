import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/editorial/SectionHeading';

import {
  methodDetails,
  methodPage,
  toolsSection,
  verticalAdaptations,
} from '@/content/methode';
import { buildMetadata } from '@/lib/metadata';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/methode');

/**
 * Page Méthode.
 *
 * Composition compacte : ouverture, grille des quatre temps, puis adaptation
 * métier et principe d'outillage réunis. Elle prolonge l'accueil sans répéter
 * chaque étape dans une bande pleine hauteur.
 */
export default function MethodePage() {
  return (
    <>
      <Section spacing="tight">
        <Container>
          <div className={styles.hero}>
            <SectionHeading level={1} eyebrow={methodPage.eyebrow} title={methodPage.title} />
            <p className={styles.heroLead}>{methodPage.lead}</p>
            <ol className={styles.index}>
              {methodDetails.map((step) => (
                <li key={step.number} className={styles.indexItem}>
                  <span className={styles.indexNumber}>{step.number}</span>
                  <span>{step.title}</span>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <Section surface="raised" ruled spacing="tight">
        <Container>
          <SectionHeading
            eyebrow="Le parcours"
            title="Quatre temps. Une progression claire."
            lead="Chaque étape répond à une question précise et prépare la suivante."
          />
          <ol className={styles.steps}>
            {methodDetails.map((step) => (
              <li key={step.number} className={styles.step}>
                <span className={styles.stepNumber}>{step.number}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepBody}>{step.body}</p>
                <p className={styles.stepListLabel}>{step.itemsLabel}</p>
                <ul className={styles.stepList}>
                  {step.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section surface="sunken" spacing="tight">
        <Container>
          <div className={styles.closing}>
            <div className={styles.adaptations}>
              <SectionHeading
                eyebrow="Adaptation par métier"
                title="Une méthode commune. Deux parcours concrets."
                lead="Les mêmes principes, avec les informations propres à votre activité."
              />
              <div className={styles.verticals}>
                {verticalAdaptations.map((vertical) => (
                  <article key={vertical.title} className={styles.vertical}>
                    <h3>{vertical.title}</h3>
                    <p>{vertical.body}</p>
                  </article>
                ))}
              </div>
            </div>
            <aside className={styles.toolsNote}>
              <span>{toolsSection.eyebrow}</span>
              <h3>{toolsSection.title}</h3>
              <p>{toolsSection.body}</p>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
