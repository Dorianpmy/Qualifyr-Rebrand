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
              {/* Carrefour : les deux actions du hero sont les deux entonnoirs
                  métier, pas des verbes génériques. « Réserver un échange » et
                  « Faire le diagnostic » n'orientaient personne — ils
                  demandaient au visiteur de s'engager avant de savoir si le
                  site le concernait. Les deux conversions restent disponibles
                  en clôture de page et sur chaque page métier. */}
              <div className={styles.heroActions}>
                <ButtonLink
                  href="/conciergerie"
                  ctaId="hero_concierge"
                  variant="inverse"
                  withArrow
                >
                  Je gère une conciergerie
                </ButtonLink>
                <ButtonLink
                  href="/nettoyage-automobile"
                  ctaId="hero_cleaning"
                  variant="inverseSecondary"
                  withArrow
                >
                  Je fais du nettoyage automobile
                </ButtonLink>
              </div>
              {/* Autorité technique en une ligne. Le bloc produit occupait une
                  section entière au milieu du carrefour et concurrençait les
                  deux portes ; réduit à une phrase, il pose l'argument — nous
                  éditons un logiciel de votre métier — sans ouvrir un troisième
                  parcours. La démonstration se fait sur la page dédiée. */}
              <p className={styles.heroSignature}>
                Nous éditons aussi notre propre outil d’acquisition pour conciergeries.{' '}
                <Link href="/outil-conciergerie" data-cta-id="hero_tool">
                  En ligne, essayable sans nous demander la permission
                </Link>
                .
              </p>
            </div>
          </Container>
        </div>
      </Section>

      {/* Numérotation de l'arc : le visiteur doit toujours savoir où il en est
          dans le raisonnement. 01 le tri, 02 la preuve, 03 le prix, 04 l'appel
          à l'action.

          L'accueil est un carrefour, pas une page de vente : les pages métier
          portent désormais tout le travail de persuasion (problème, réponse,
          conséquences, pourquoi nous). Deux sections ont été retirées le
          11/08/2026 parce qu'elles répétaient ce travail en moins précis —
          « Ce que nous transformons », abstrait et sans métier, et « Notre
          méthode », doublon littéral de `verticalMethod` rendu sur les deux
          pages métier et sur `/methode`. */}
      <Section id="pour-qui" surface="sunken" ruled spacing="tight">
        <Container>
          <div className={styles.sectionIntro}>
            <SectionHeading
              eyebrow="01 — Les deux métiers"
              title="Deux métiers, deux façons de perdre un client."
              lead="Dans les deux cas, le client décide avant de vous parler. Ce qu’il cherche à ce moment-là n’est pas le même — et c’est là que tout se joue."
            />
          </div>
          <ol className={styles.companyList}>
            {serviceCompanies.map((company, index) => (
              <li key={company.title}>
                <Link
                  href={company.href}
                  className={styles.companyLink}
                  data-cta-id={company.href === '/conciergerie' ? 'home_concierge_page' : 'home_cleaning_page'}
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
            Une même exigence de clarté, adaptée au fonctionnement réel de chaque activité.
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

      {/* Le prix avant l'appel à l'action : c'est la question que tout le monde
          se pose et que personne n'ose poser. La masquer fait fuir ceux qui
          n'ont pas le budget, et fait hésiter ceux qui l'ont. */}
      <Section id="tarifs" surface="sunken" spacing="tight" ruled>
        <Container>
          <div className={styles.pricing}>
            <div>
              <Eyebrow>03 — Tarifs</Eyebrow>
              <h2>Ce que ça coûte, sans devoir demander.</h2>
              <p>
                Un outil à 79 € par mois, un site vitrine à partir de 990 €, un site avec parcours
                de demande entre 2 200 et 3 800 €. Les fourchettes sont affichées, les facteurs qui
                les font varier aussi.
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
            {/* Deux actions, plus trois. Le diagnostic reste principal : c'est
                le seul parcours qui répond à la question que tout le monde se
                pose — ce que ça coûte, et ce qu'il faut faire en premier.
                L'estimation de budget faisait doublon avec lui et diluait le
                choix ; elle reste accessible depuis la page Tarifs. */}
            <div className={styles.finalActions}>
              <DiagnosticLink ctaId="final_diagnostic" variant="primary">
                Voir ce qui bloque mes demandes
              </DiagnosticLink>
              <BookingButton ctaId="final_booking" variant="secondary">
                Réserver un échange
              </BookingButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
