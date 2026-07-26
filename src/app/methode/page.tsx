import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { CallToAction } from '@/components/editorial/CallToAction';
import { EditorialCard } from '@/components/editorial/EditorialCard';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { Eyebrow } from '@/components/ui/Eyebrow';

import {
  methodCta,
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
 * Composition propre : ouverture large avec index des quatre temps, puis un
 * diptyque décalé par étape (intention à gauche, contenu réel à droite), en
 * alternant les surfaces. Elle prolonge l'accueil sans le répéter — l'accueil
 * annonce les quatre temps, cette page dit ce qu'ils contiennent.
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

      {methodDetails.map((step, index) => (
        <Section
          key={step.number}
          surface={index % 2 === 0 ? 'page' : 'raised'}
          ruled
          spacing="tight"
        >
          <Container>
            <div className={styles.step}>
              <div className={styles.stepIntro}>
                <span className={styles.stepNumber}>{step.number}</span>
                <h2 className={styles.stepTitle}>{step.title}</h2>
                <p className={styles.stepBody}>{step.body}</p>
              </div>
              <div>
                <p className={styles.stepListLabel}>{step.itemsLabel}</p>
                <ul className={styles.stepList}>
                  {step.items.map((item) => (
                    <li key={item} className={styles.stepItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </Section>
      ))}

      <Section ruled spacing="tight">
        <Container>
          <SectionHeading
            eyebrow="Adaptation par métier"
            title="Une méthode commune. Deux parcours concrets."
            lead="Nous conservons les mêmes étapes, puis adaptons les informations et les moments de décision à votre activité."
          />
          <div className={styles.principles}>
            {verticalAdaptations.map((vertical) => (
              <EditorialCard key={vertical.title} title={vertical.title}>
                {vertical.body}
              </EditorialCard>
            ))}
          </div>
        </Container>
      </Section>

      <Section surface="sunken">
        <Container>
          <div className={styles.tools}>
            <div>
              <Eyebrow>{toolsSection.eyebrow}</Eyebrow>
              <SectionHeading title={toolsSection.title} className="stack-lg" />
            </div>
            <div className={styles.toolsText}>
              {toolsSection.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className={styles.principles}>
              {toolsSection.principles.map((principle) => (
                <EditorialCard key={principle.title} title={principle.title}>
                  {principle.body}
                </EditorialCard>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section surface="inverse">
        <Container>
          <CallToAction
            eyebrow={methodCta.eyebrow}
            title={methodCta.title}
            actionLabel={methodCta.label}
          >
            {methodCta.body}
          </CallToAction>
        </Container>
      </Section>
    </>
  );
}
