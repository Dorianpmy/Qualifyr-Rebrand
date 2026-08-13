import type { Metadata } from 'next';
import Link from 'next/link';
import { BookingButton } from '@/components/agency/BookingButton';
import { DiagnosticLink } from '@/components/agency/DiagnosticLink';
import { InteractiveSitePreview } from '@/components/editorial/InteractiveSitePreview';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { hero, serviceCompanies } from '@/content/home';
import { swCarCleaning } from '@/content/sw-car-cleaning';
import { buildMetadata } from '@/lib/metadata';
import { webPage } from '@/lib/structured-data';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/');

export default function HomePage() {
  return (
    <>
      <JsonLd data={webPage('/')} />

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
              <Eyebrow inverse>{hero.eyebrow}</Eyebrow>
              <h1 className={styles.heroTitle}>{hero.title}</h1>
              <p className={styles.heroBody}>{hero.body}</p>
              <div className={styles.heroActions}>
                <ButtonLink
                  href="/nettoyage-automobile"
                  ctaId="hero_cleaning"
                  variant="inverse"
                  withArrow
                >
                  Voir l’approche detailing
                </ButtonLink>
                <ButtonLink
                  href="/diagnostic"
                  ctaId="hero_diagnostic"
                  variant="inverseSecondary"
                  withArrow
                >
                  Faire le diagnostic
                </ButtonLink>
              </div>
              <p className={styles.heroSignature}>
                Nous concevons aussi le parcours de réservation.{' '}
                <Link href="/nettoyage-automobile#demonstration" data-cta-id="hero_tool_cleaning_demo">
                  Voir la démonstration
                </Link>
                .
              </p>
            </div>
          </Container>
        </div>
      </Section>

      <Section id="pour-qui" surface="sunken" ruled spacing="tight">
        <Container>
          <div className={styles.sectionIntro}>
            <SectionHeading
              eyebrow="01 — Pour qui"
              title="Un métier, une façon de perdre un client."
              lead="Dans le nettoyage automobile, le client décide souvent avant de vous parler. Ce qu’il cherche à ce moment-là, c’est de la clarté — et c’est là que tout se joue."
            />
          </div>
          <ol className={styles.companyList}>
            {serviceCompanies.map((company, index) => (
              <li key={company.title}>
                <Link
                  href={company.href}
                  className={styles.companyLink}
                  data-cta-id="home_cleaning_page"
                >
                  <span className={styles.companyNumber}>{String(index + 1).padStart(2, '0')}</span>
                  <span className={styles.companyCopy}>
                    <span className={styles.companyTitle}>{company.title}</span>
                    <span className={styles.companyBody}>{company.body}</span>
                    <span className={styles.companyBody}>Voir notre approche</span>
                  </span>
                  <span className={styles.companyArrow} aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ol>
          <p className={styles.companyNote}>
            Une exigence de clarté adaptée au fonctionnement réel de votre activité.
          </p>
        </Container>
      </Section>

      <Section id="sw-car-cleaning" surface="inverse" spacing="tight">
        <Container>
          <div className={styles.caseGrid}>
            <div className={styles.caseContent}>
              <Eyebrow inverse>02 — Réalisation réelle</Eyebrow>
              <h2>SW Car Cleaning</h2>
              <p className={styles.caseLead}>
                Une identité et une expérience digitale conçues pour rendre l’offre plus
                claire, renforcer la crédibilité et simplifier la prise de contact.
              </p>
              <ul className={styles.factList} aria-label="Éléments réalisés">
                <li>Clarification des prestations</li>
                <li>Identité cohérente</li>
                <li>Expérience mobile optimisée</li>
              </ul>
              <ButtonLink href="/realisations/sw-car-cleaning" ctaId="home_sw_case" variant="inverse" withArrow>
                Voir comment nous l’avons construit
              </ButtonLink>
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

      <Section id="tarifs" surface="sunken" spacing="tight" ruled>
        <Container>
          <div className={styles.pricing}>
            <div>
              <Eyebrow>03 — Tarifs</Eyebrow>
              <h2>Ce que ça coûte, sans devoir demander.</h2>
              <p>
                Un site vitrine à partir de 990 €, un site avec parcours de demande entre 2 200 et 3 800 €.
                Les fourchettes sont affichées, les facteurs qui les font varier aussi.
              </p>
            </div>
            <div className={styles.pricingAction}>
              <ButtonLink href="/tarifs" ctaId="home_pricing" withArrow>
                Voir les tarifs
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>

      <Section spacing="tight" ruled className={styles.finalSection}>
        <Container>
          <div className={styles.finalCta}>
            <div>
              <Eyebrow>04 — Votre prochaine étape</Eyebrow>
              <h2>Votre activité est déjà solide. Sa présentation doit l’être aussi.</h2>
              <p>
                Parlez-nous de votre entreprise et découvrons comment mieux traduire votre
                savoir-faire en une expérience que vos prospects comprennent et choisissent.
              </p>
            </div>
            <div className={styles.finalActions}>
              <DiagnosticLink ctaId="final_diagnostic" variant="primary">
                Voir ce qui bloque mes demandes
              </DiagnosticLink>
              <BookingButton ctaId="final_booking" variant="secondary">
                Réserver une analyse de parcours
              </BookingButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
