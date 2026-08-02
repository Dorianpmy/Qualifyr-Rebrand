import type { Metadata } from 'next';
import { OfferConfigurator } from '@/components/agency/OfferConfigurator';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { buildMetadata } from '@/lib/metadata';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/estimation');

export default function EstimationPage() {
  return (
    <>
      <Section spacing="tight" ruled>
        <Container>
          <div className={styles.intro}>
            <div>
              <Eyebrow>Première estimation</Eyebrow>
              <h1>Obtenez une première vision de votre projet.</h1>
            </div>
            <div className={styles.introCopy}>
              <p>
                Quelques choix suffisent pour découvrir une première orientation, les éléments
                recommandés et un coût indicatif avant notre échange.
              </p>
              <ul aria-label="Repères de l’estimation">
                <li>Estimation indicative</li>
                <li>Sans engagement</li>
                <li>Validation après cadrage</li>
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section surface="sunken" spacing="tight" ruled>
        <Container>
          <OfferConfigurator showIntro={false} />
        </Container>
      </Section>
    </>
  );
}
