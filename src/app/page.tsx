import type { Metadata } from 'next';
import { BookingButton } from '@/components/agency/BookingButton';
import { OfferConfigurator } from '@/components/agency/OfferConfigurator';
import { WhatsAppDiagnosticButton } from '@/components/agency/WhatsAppDiagnostic';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { CreativeLab } from '@/components/editorial/CreativeLab';
import { InteractiveSitePreview } from '@/components/editorial/InteractiveSitePreview';
import { MethodStep } from '@/components/editorial/MethodStep';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { TextLink } from '@/components/ui/TextLink';
import {
  hero,
  method,
  serviceCompanies,
  transformations,
} from '@/content/home';
import { swCarCleaning } from '@/content/sw-car-cleaning';
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
                <TextLink href="#sw-car-cleaning" tone="inverse">Découvrir notre réalisation</TextLink>
              </p>
            </div>
          </div>
          </Container>
        </div>
      </Section>

      <Section id="expertise" spacing="tight" ruled>
        <Container>
          <div className={styles.transformationIntro}>
            <SectionHeading
              eyebrow="Ce que nous transformons"
              title="Votre activité mérite plus qu’un site correct."
            />
            <p>
              Elle mérite une présentation à la hauteur de votre savoir-faire et un parcours
              qui donne envie de vous choisir.
            </p>
          </div>
          <ol className={styles.transformations}>
            {transformations.map((item) => (
              <li key={item.number} className={styles.transformation}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section id="sw-car-cleaning" surface="inverse" spacing="tight">
        <Container>
          <div className={styles.caseGrid}>
            <div className={styles.caseContent}>
              <Eyebrow inverse>Réalisation sélectionnée</Eyebrow>
              <h2>SW Car Cleaning</h2>
              <p className={styles.caseLead}>
                Une identité et une expérience digitale conçues pour rendre l’offre plus
                claire, renforcer la crédibilité et simplifier la prise de contact.
              </p>
              <ul className={styles.factList}>
                <li>Clarification des prestations</li>
                <li>Identité cohérente</li>
                <li>Expérience mobile optimisée</li>
              </ul>
              <div className={styles.actions}>
                <ButtonLink href="/realisations/sw-car-cleaning" variant="inverse">
                  Découvrir la réalisation
                </ButtonLink>
                <BookingButton variant="inverseSecondary">
                  Créer une expérience similaire
                </BookingButton>
              </div>
            </div>
            {swCarCleaning.externalUrl ? (
              <InteractiveSitePreview
                url={swCarCleaning.externalUrl}
                title="Site SW Carcleaning interactif"
                domain="swcarcleaning.ch"
                caption="Site réel · Fribourg"
              />
            ) : null}
          </div>
        </Container>
      </Section>

      <Section id="pour-qui" surface="sunken" ruled spacing="tight">
        <Container>
          <div className={styles.companies}>
            <SectionHeading
              eyebrow="Entreprises de services"
              title="Conçu pour les entreprises qui vendent un véritable savoir-faire."
              lead="Qualifyr accompagne des entreprises de services qui ont besoin d’être mieux comprises, mieux présentées et plus facilement contactées."
            />
            <ul className={styles.companyList}>
              {serviceCompanies.map((company, index) => (
                <li key={company}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {company}
                </li>
              ))}
            </ul>
            <p className={styles.companyNote}>
              Une même exigence de clarté, adaptée au fonctionnement réel de chaque activité.
            </p>
          </div>
        </Container>
      </Section>

      <Section ruled spacing="tight">
        <Container>
          <SectionHeading
            eyebrow="Notre méthode"
            title="Une méthode claire. Aucun effet inutile."
          />
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

      <Section id="estimation" surface="sunken" ruled spacing="tight">
        <Container>
          <OfferConfigurator />
        </Container>
      </Section>

      <Section surface="inverse" spacing="tight" className={styles.finalSection}>
        <Container>
          <div className={styles.finalCta}>
            <div>
              <Eyebrow inverse>Votre prochaine étape</Eyebrow>
              <h2>Votre activité est déjà solide. Sa présentation doit l’être aussi.</h2>
              <p>
                Parlez-nous de votre entreprise et découvrons comment mieux traduire votre
                savoir-faire en une expérience que vos prospects comprennent et choisissent.
              </p>
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
