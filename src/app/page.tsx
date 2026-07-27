import type { Metadata } from 'next';
import Image from 'next/image';
import { BookingButton } from '@/components/agency/BookingButton';
import { WhatsAppDiagnosticButton } from '@/components/agency/WhatsAppDiagnostic';
import { OfferConfigurator } from '@/components/agency/OfferConfigurator';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { EditorialCard } from '@/components/editorial/EditorialCard';
import { CreativeLab } from '@/components/editorial/CreativeLab';
import { MethodStep } from '@/components/editorial/MethodStep';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { TextLink } from '@/components/ui/TextLink';
import { featuredCase, hero, method, sectors } from '@/content/home';
import { buildMetadata } from '@/lib/metadata';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/');

export default function HomePage() {
  return (
    <>
      <Section spacing="flush" className={styles.heroSection}>
        <video
          className={styles.heroVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/qualifyr-hero-poster.webp"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source
            src="/videos/qualifyr-hero-background.mp4"
            type="video/mp4"
            media="(prefers-reduced-motion: no-preference)"
          />
        </video>
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={styles.heroContent}>
          <Container>
          <div className={styles.hero}>
            <div className={styles.heroText}>
              <Eyebrow inverse>{hero.eyebrow}</Eyebrow>
              <h1 className={styles.heroTitle}>{hero.title}</h1>
              <p className={styles.heroBody}>{hero.body}</p>
              <div className={styles.heroActions}>
                <BookingButton variant="inverse" withArrow>Réserver un échange</BookingButton>
                <WhatsAppDiagnosticButton variant="inverseSecondary">
                  Faire le diagnostic WhatsApp
                </WhatsAppDiagnosticButton>
              </div>
              <p className={styles.heroProofLink}>
                <TextLink href="#sw-car-cleaning" tone="inverse">Voir notre réalisation</TextLink>
              </p>
            </div>
            <div className={styles.heroPlate} aria-label="Les trois fondations du parcours Qualifyr">
              <p>Le parcours Qualifyr</p>
              <ol>
                <li><span>01</span> Comprendre</li>
                <li><span>02</span> Convaincre</li>
                <li><span>03</span> Passer à l’action</li>
              </ol>
            </div>
          </div>
          </Container>
        </div>
      </Section>

      <Section id="sw-car-cleaning" spacing="tight">
        <Container>
          <div className={styles.caseGrid}>
            <a
              className={styles.casePreview}
              href="https://www.swcarcleaning.ch/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Voir le site SW Carcleaning"
            >
              <Image
                src={featuredCase.preview.src}
                alt={featuredCase.preview.alt}
                width={featuredCase.preview.width}
                height={featuredCase.preview.height}
                sizes="(min-width: 62rem) 55vw, 100vw"
              />
            </a>
            <div className={styles.caseContent}>
              <Eyebrow>Réalisation réelle</Eyebrow>
              <h2>SW Car Cleaning</h2>
              <p className={styles.lead}>{featuredCase.summary}</p>
              <ul className={styles.factList}>
                {featuredCase.objectives.map((objective) => <li key={objective.title}>{objective.title}</li>)}
              </ul>
              <div className={styles.actions}>
                <ButtonLink href="/realisations/sw-car-cleaning" variant="secondary">
                  Découvrir le projet
                </ButtonLink>
                <WhatsAppDiagnosticButton>Parler de mon projet</WhatsAppDiagnosticButton>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section id="pour-qui" surface="sunken" ruled spacing="tight">
        <Container>
          <SectionHeading title="Deux activités, un même besoin : rendre le parcours client plus simple." />
          <div className={styles.twoGrid}>
            {sectors.map((sector) => (
              <EditorialCard key={sector.title} title={sector.title}>{sector.body}</EditorialCard>
            ))}
          </div>
        </Container>
      </Section>

      <Section ruled spacing="tight">
        <Container>
          <SectionHeading title="Un fonctionnement simple, en trois étapes." />
          <ol className={styles.methodGrid}>
            {method.map((step) => (
              <MethodStep key={step.number} number={step.number} title={step.title}>
                {step.body}
              </MethodStep>
            ))}
          </ol>
        </Container>
      </Section>

      <Section surface="raised" ruled spacing="tight" id="laboratoire">
        <Container>
          <CreativeLab />
        </Container>
      </Section>

      <Section id="notre-offre" surface="sunken" ruled spacing="tight">
        <Container>
          <OfferConfigurator />
        </Container>
      </Section>

      <Section surface="inverse" spacing="tight" className={styles.finalSection}>
        <Container>
          <div className={styles.finalCta}>
            <div>
              <Eyebrow>Votre prochaine étape</Eyebrow>
              <h2>Votre activité mérite un parcours plus clair.</h2>
              <p>Présentez-nous votre situation. Nous verrons ensemble ce qu’il faut clarifier, construire ou améliorer.</p>
            </div>
            <div className={styles.finalActions}>
              <BookingButton variant="inverse" withArrow>Réserver un échange</BookingButton>
              <WhatsAppDiagnosticButton variant="inverseSecondary">Faire le diagnostic WhatsApp</WhatsAppDiagnosticButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
