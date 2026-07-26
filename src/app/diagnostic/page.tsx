import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { DiagnosticForm } from '@/components/form/DiagnosticForm';
import { Eyebrow } from '@/components/ui/Eyebrow';

import { buildMetadata } from '@/lib/metadata';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/diagnostic');

/**
 * Page Diagnostic.
 *
 * L'interface du formulaire est complète ; la logique d'envoi sera mise en
 * service à l'étape suivante. Aucune promesse de délai de réponse n'est faite,
 * aucune mention de gratuité ni de disponibilité limitée.
 */
const afterSteps = [
  {
    number: '01',
    title: 'Nous lisons vos réponses',
    body: 'Votre activité, votre zone et vos prestations, pour comprendre le contexte avant d’en parler.',
  },
  {
    number: '02',
    title: 'Nous préparons l’échange',
    body: 'Nous repérons les points qui méritent d’être clarifiés en premier, et ceux qui peuvent attendre.',
  },
  {
    number: '03',
    title: 'Nous vous répondons',
    body: 'Par e-mail, avec ce que nous avons vu et ce que nous proposons d’examiner ensemble.',
  },
] as const;

export default function DiagnosticPage() {
  return (
    <>
      <Section spacing="tight">
        <Container>
          <div className={styles.hero}>
            <SectionHeading
              level={1}
              eyebrow="Diagnostic"
              title="Identifions ce qui freine vos prochaines réservations."
            />
            <p className={styles.heroLead}>
              Répondez à quelques questions sur votre activité. Nous pourrons ensuite préparer
              un échange plus concret.
            </p>
          </div>
        </Container>
      </Section>

      <Section surface="raised" ruled spacing="tight">
        <Container>
          <Eyebrow>Ce qui se passe ensuite</Eyebrow>
          <div className={styles.steps}>
            {afterSteps.map((step) => (
              <article key={step.number} className={styles.step}>
                <span className={styles.stepNumber}>{step.number}</span>
                <h2 className={styles.stepTitle}>{step.title}</h2>
                <p className={styles.stepBody}>{step.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className={styles.formLayout}>
            <div className={styles.formAside}>
              <SectionHeading level={2} title="Parlez-nous de votre activité." />
              <p>
                Une dizaine de questions, quelques minutes. Plus vos réponses sont précises,
                plus l’échange qui suit est utile.
              </p>
              <p>
                Les champs marqués « facultatif » peuvent rester vides. Vos réponses servent
                uniquement à préparer notre échange.
              </p>
            </div>
            <DiagnosticForm />
          </div>
        </Container>
      </Section>
    </>
  );
}
