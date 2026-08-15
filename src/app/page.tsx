import type { Metadata } from 'next';
import Link from 'next/link';
import { BookingButton } from '@/components/agency/BookingButton';
import { DiagnosticLink } from '@/components/agency/DiagnosticLink';
import { InteractiveSitePreview } from '@/components/editorial/InteractiveSitePreview';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { frictionPoints, hero, saasHome } from '@/content/home';
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
                <ButtonAnchor
                  href={saasHome.primaryCta.href}
                  ctaId="hero_saas_demo"
                  variant="inverseSecondary"
                  withArrow
                >
                  Essayer l’outil réservation
                </ButtonAnchor>
              </div>
              <p className={styles.heroSignature}>
                Site vitrine + parcours de réservation pour detailers.{' '}
                <Link href="#outil-detailers" data-cta-id="hero_saas_anchor">
                  Découvrir l’outil →
                </Link>
              </p>
            </div>
          </Container>
        </div>
      </Section>

      <Section id="outil-detailers" surface="inverse" spacing="tight" className={styles.saasSection}>
        <Container>
          <div className={styles.saasGrid}>
            <div className={styles.saasCopy}>
              <Eyebrow inverse>{saasHome.eyebrow}</Eyebrow>
              <h2 className={styles.saasTitle}>{saasHome.title}</h2>
              <p className={styles.saasLead}>{saasHome.lead}</p>
              <div className={styles.saasActions}>
                <ButtonLink
                  href={saasHome.primaryCta.href}
                  ctaId="home_saas_demo"
                  variant="inverse"
                  withArrow
                >
                  {saasHome.primaryCta.label}
                </ButtonLink>
                <ButtonLink
                  href={saasHome.secondaryCta.href}
                  ctaId="home_saas_login"
                  variant="inverseSecondary"
                >
                  {saasHome.secondaryCta.label}
                </ButtonLink>
              </div>
            </div>
            <ul className={styles.saasPoints} aria-label="Points forts de l’outil">
              {saasHome.points.map((point) => (
                <li key={point.title}>
                  <strong>{point.title}</strong>
                  <span>{point.body}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section id="pour-qui" surface="sunken" ruled spacing="tight">
        <Container>
          <div className={styles.sectionIntro}>
            <SectionHeading
              eyebrow="01 — Le problème"
              title="Trois freins qui font partir un client prêt à réserver."
              lead="Dans le nettoyage automobile, le prospect décide souvent avant de vous parler. S’il ne comprend pas l’offre, ne voit pas les tarifs ou ne trouve pas comment réserver, il passe au suivant."
            />
          </div>
          <ol className={styles.companyList}>
            {frictionPoints.map((point) => (
              <li key={point.number}>
                <div className={styles.companyLink}>
                  <span className={styles.companyNumber}>{point.number}</span>
                  <span className={styles.companyCopy}>
                    <span className={styles.companyTitle}>{point.title}</span>
                    <span className={styles.companyBody}>{point.body}</span>
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <p className={styles.companyNote}>
            <Link href="/nettoyage-automobile" data-cta-id="home_cleaning_from_friction">
              Voir comment on résout ça →
            </Link>
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
                SaaS réservation dès 49 €/mois (Pro 89 €). Site vitrine à partir de 690 €,
                site avec parcours de demande entre 1 490 et 2 490 €. Détail sur la page tarifs.
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
