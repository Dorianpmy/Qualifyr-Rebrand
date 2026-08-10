import type { Metadata } from 'next';
import Link from 'next/link';
import { BookingButton } from '@/components/agency/BookingButton';
import { DiagnosticLink } from '@/components/agency/DiagnosticLink';
import { InteractiveSitePreview } from '@/components/editorial/InteractiveSitePreview';
import { MethodStep } from '@/components/editorial/MethodStep';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { hero, method, serviceCompanies, transformations } from '@/content/home';
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
                <BookingButton ctaId="hero_booking" variant="inverse" withArrow>
                  Réserver un échange
                </BookingButton>
                <DiagnosticLink ctaId="hero_diagnostic" variant="inverseSecondary">
                  Faire le diagnostic
                </DiagnosticLink>
              </div>
              <ButtonLink href="#sw-car-cleaning" variant="text" className={styles.heroTextLink}>
                Découvrir notre réalisation
              </ButtonLink>
            </div>
          </Container>
        </div>
      </Section>

      <Section id="expertise" spacing="tight" ruled>
        <Container>
          <div className={styles.transformationIntro}>
            {/* Numérotation de l'arc : le visiteur doit toujours savoir où il
                en est dans le raisonnement. 01 le constat, 02 la preuve,
                03 pour qui, 04 le produit, 05 la méthode, 06 le prix. */}
            <SectionHeading
              eyebrow="01 — Ce que nous transformons"
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
              <Eyebrow inverse>02 — Réalisation sélectionnée</Eyebrow>
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
                Découvrir la réalisation
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

      <Section id="pour-qui" surface="sunken" ruled spacing="tight">
        <Container>
          <div className={styles.sectionIntro}>
            <SectionHeading
              eyebrow="03 — Entreprises de services"
              title="Conçu pour les entreprises où la confiance précède la prise de contact."
              lead="Qualifyr accompagne les entreprises de services dont le savoir-faire doit être compris et crédible avant le premier échange."
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
                    <span className={styles.companyBody}>Découvrir notre approche</span>
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

      {/* Le produit est présenté juste après les deux verticales : le visiteur
          vient de comprendre ce que nous faisons sur mesure, c'est le bon
          moment pour lui proposer la formule légère. */}
      <Section id="outil" surface="inverse" spacing="tight">
        <Container>
          <div className={styles.product}>
            <div className={styles.productCopy}>
              <Eyebrow inverse>04 — Produit · Conciergeries</Eyebrow>
              <h2>Le propriétaire veut un chiffre avant de vous appeler.</h2>
              <p>
                Tant qu’il ne l’a pas, il ne vous contacte pas — et vous ne saurez jamais qu’il a
                hésité. Notre outil lui donne ce chiffre, récupère ses coordonnées et vous transmet
                la demande avec le logement décrit et l’estimation déjà calculée.
              </p>
              <ol className={styles.productSteps}>
                <li>
                  <strong>Il estime</strong>
                  <span>Quatre choix, une fourchette de revenus annuels.</span>
                </li>
                <li>
                  <strong>Vous recevez</strong>
                  <span>Ville, bien, contact et estimation, dans votre tableau de bord.</span>
                </li>
                <li>
                  <strong>Vous rappelez</strong>
                  <span>Un propriétaire déjà convaincu par le montant qu’il a vu.</span>
                </li>
              </ol>
              <ButtonLink href="/outil-conciergerie" ctaId="home_tool" variant="inverse" withArrow>
                Découvrir l’outil
              </ButtonLink>
            </div>

            <aside className={styles.productCard}>
              <p className={styles.productPrice}>
                79 € <span>par mois</span>
              </p>
              <p className={styles.productArgument}>
                Un mandat signé rapporte plusieurs milliers d’euros par an. Le premier propriétaire
                converti rembourse l’année.
              </p>
              <ul className={styles.productFacts}>
                <li>En ligne en dix minutes</li>
                <li>Vos secteurs, vos barèmes</li>
                <li>Essai gratuit, sans engagement</li>
              </ul>
              <Link
                className={styles.productLink}
                href="/simulateur-revenus-locatifs"
                data-cta-id="home_simulator"
              >
                Voir une estimation en direct ↗
              </Link>
            </aside>
          </div>
        </Container>
      </Section>

      <Section id="methode" spacing="tight" ruled>
        <Container>
          <SectionHeading
            eyebrow="05 — Notre méthode"
            title="Quatre étapes. Une direction claire."
            lead="Nous avançons sans ajouter de complexité inutile à votre quotidien."
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

      {/* Le prix avant l'appel à l'action : c'est la question que tout le monde
          se pose et que personne n'ose poser. La masquer fait fuir ceux qui
          n'ont pas le budget, et fait hésiter ceux qui l'ont. */}
      <Section id="tarifs" surface="sunken" spacing="tight" ruled>
        <Container>
          <div className={styles.pricing}>
            <div>
              <Eyebrow>06 — Tarifs</Eyebrow>
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
              <Eyebrow>07 — Votre prochaine étape</Eyebrow>
              <h2>Votre activité est déjà solide. Sa présentation doit l’être aussi.</h2>
              <p>
                Parlez-nous de votre entreprise et découvrons comment mieux traduire votre
                savoir-faire en une expérience que vos prospects comprennent et choisissent.
              </p>
            </div>
            {/* Le diagnostic passe en action principale : c'est le seul
                parcours qui répond à la question que tout le monde se pose —
                ce que ça coûte, et ce qu'il faut faire en premier. */}
            <div className={styles.finalActions}>
              <DiagnosticLink ctaId="final_diagnostic" variant="primary">
                Faire le diagnostic
              </DiagnosticLink>
              <BookingButton ctaId="final_booking" variant="secondary">
                Réserver un échange
              </BookingButton>
              <ButtonLink href="/estimation" ctaId="estimation_start" variant="text">
                Obtenir une estimation de budget
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
