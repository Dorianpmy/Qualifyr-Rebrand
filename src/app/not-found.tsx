import type { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { ButtonLink } from '@/components/ui/Button';
import { primaryCta } from '@/content/brand';
import styles from './not-found.module.css';

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <Section>
      <Container width="reading">
        <SectionHeading
          level={1}
          eyebrow="Erreur 404"
          title="Cette page n’existe pas."
          lead="Le lien est peut-être incomplet, ou la page a changé d’adresse."
        />
        <div className={styles.actions}>
          <ButtonLink href="/" variant="secondary">
            Retour à l’accueil
          </ButtonLink>
          <ButtonLink href={primaryCta.href} withArrow>
            {primaryCta.label}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
