import type { Metadata } from 'next';
import { Fragment } from 'react';

import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';

import { CallToAction } from '@/components/editorial/CallToAction';
import { CasePlate } from '@/components/editorial/CasePlate';
import { CaseStudyCard } from '@/components/editorial/CaseStudyCard';
import { ComparisonPanel } from '@/components/editorial/ComparisonPanel';
import { EditorialCard } from '@/components/editorial/EditorialCard';
import { FAQAccordion } from '@/components/editorial/FAQAccordion';
import { HeroComposition } from '@/components/editorial/HeroComposition';
import { JourneyTrack } from '@/components/editorial/JourneyTrack';
import { MethodStep } from '@/components/editorial/MethodStep';
import { SectionHeading } from '@/components/editorial/SectionHeading';

import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { TextLink } from '@/components/ui/TextLink';

import { brand, primaryCta } from '@/content/brand';
import { faq } from '@/content/faq';
import {
  clientJourney,
  comparison,
  featuredCase,
  heroEyebrow,
  heroLine,
  method,
  offer,
  pillars,
  problems,
  reassurance,
  sectors,
} from '@/content/home';
import { buildMetadata } from '@/lib/metadata';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/');

export default function HomePage() {
  return (
    <>
      {/* ---------------------- 1 · Hero ---------------------- */}
      <Section spacing="flush">
        <Container>
          <div className={styles.hero}>
            <div className={styles.heroText}>
              <Eyebrow>{heroEyebrow}</Eyebrow>
              <h1 className={styles.heroTitle}>{brand.promise}</h1>
              <p className={styles.heroBody}>{brand.explanation}</p>
              <div className={styles.heroActions}>
                <ButtonLink href={primaryCta.href} withArrow>
                  {primaryCta.label}
                </ButtonLink>
                <ButtonLink href="#notre-methode" variant="secondary">
                  Découvrir notre méthode
                </ButtonLink>
              </div>
              <p className={styles.heroLine}>
                {heroLine.map((word, index) => (
                  <Fragment key={word}>
                    {index > 0 ? (
                      <span className={styles.heroLineSeparator} aria-hidden="true">
                        ·
                      </span>
                    ) : null}
                    <span>{word}</span>
                  </Fragment>
                ))}
              </p>
            </div>

            <div className={styles.heroComposition}>
              <HeroComposition />
            </div>
          </div>
        </Container>
      </Section>

      <Section surface="raised" ruled spacing="tight">
        <Container>
          <SectionHeading
            eyebrow="Deux verticales"
            title="Deux métiers, une même exigence : simplifier le parcours client."
            lead="Une méthode commune, adaptée aux contraintes concrètes de chaque activité."
          />
          <div className={styles.blocks}>
            {sectors.map((sector) => (
              <EditorialCard key={sector.title} title={sector.title}>
                {sector.body}
              </EditorialCard>
            ))}
          </div>
        </Container>
      </Section>

      {/* -------------------- 2 · Le problème -------------------- */}
      <Section>
        <Container>
          <SectionHeading
            split
            eyebrow="Le constat"
            title="Un excellent résultat ne suffit pas si réserver reste compliqué."
            lead="Vous pouvez fournir une prestation ou un accompagnement irréprochable et malgré tout perdre des demandes si votre offre est difficile à comprendre, si les informations sont dispersées ou si la prise de contact demande trop d’échanges."
          />
          <div className={styles.blocks}>
            {problems.map((item) => (
              <EditorialCard key={item.title} title={item.title}>
                {item.body}
              </EditorialCard>
            ))}
          </div>
        </Container>
      </Section>

      {/* ----------------- 3 · Résultats recherchés ----------------- */}
      <Section surface="raised" ruled>
        <Container>
          <SectionHeading
            eyebrow="Ce que nous cherchons à obtenir"
            title="Un parcours pensé pour développer votre activité."
          />
          <div className={styles.pillars}>
            {pillars.map((pillar) => (
              <EditorialCard
                key={pillar.number}
                size="large"
                eyebrow={pillar.number}
                title={pillar.title}
              >
                {pillar.body}
              </EditorialCard>
            ))}
          </div>
        </Container>
      </Section>

      {/* ------------------ 4 · Parcours client ------------------ */}
      <Section>
        <Container>
          <SectionHeading
            split
            eyebrow="Le parcours client"
            title="De la première recherche à la prochaine réservation."
            lead="Neuf moments qui s’enchaînent. Chacun peut faire gagner ou perdre une réservation."
          />
          <div className={styles.spaced} data-reveal-target>
            <JourneyTrack steps={clientJourney} />
          </div>
        </Container>
      </Section>

      {/* --------------------- 5 · L’offre --------------------- */}
      <Section surface="raised" ruled>
        <Container>
          <SectionHeading
            split
            eyebrow="Le parcours Qualifyr"
            title="Un seul accompagnement autour de votre développement."
            lead="Nous ne livrons pas simplement une page sur internet. Nous construisons ce qui relie votre savoir-faire à vos prochaines demandes et réservations."
          />
          <div className={styles.offerGrid}>
            {offer.map((item) => (
              <EditorialCard key={item.number} eyebrow={item.number} title={item.title}>
                {item.body}
              </EditorialCard>
            ))}
          </div>
        </Container>
      </Section>

      {/* ------------------ 6 · Avant / après ------------------ */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Ce qui change" title="Moins d’improvisation. Plus de clarté." />
          <div className={styles.spaced} data-reveal-target>
            <ComparisonPanel
              beforeLabel="Souvent aujourd’hui"
              afterLabel="Avec un parcours en place"
              before={comparison.before}
              after={comparison.after}
              note="Ce comparatif décrit une façon de travailler, pas un résultat garanti. Chaque activité a ses contraintes, et le parcours se construit à partir des vôtres."
            />
          </div>
        </Container>
      </Section>

      {/* ------------------- 7 · Réalisation ------------------- */}
      <Section surface="sunken">
        <Container>
          <SectionHeading eyebrow="Réalisation" title={featuredCase.title} />
          <div className={styles.spaced} data-reveal-target>
            <CaseStudyCard
              offset
              client={featuredCase.client}
              title="Présenter clairement un service de nettoyage automobile"
              summary={featuredCase.summary}
              media={
                <CasePlate
                  client={featuredCase.client}
                  meta={featuredCase.sector}
                  logo={featuredCase.logo}
                  tone="sand"
                />
              }
              action={
                <ButtonLink href="/realisations/sw-car-cleaning" variant="secondary">
                  {featuredCase.ctaLabel}
                </ButtonLink>
              }
            />

          </div>
        </Container>
      </Section>

      {/* --------------------- 8 · Méthode --------------------- */}
      <Section id="notre-methode" ruled>
        <Container>
          <div className={styles.methodLayout}>
            <SectionHeading
              eyebrow="Notre méthode"
              title="Une méthode simple, construite autour de votre activité."
            />
            <div>
              <ol className={styles.methodSteps}>
                {method.map((step) => (
                  <MethodStep key={step.number} number={step.number} title={step.title}>
                    {step.body}
                  </MethodStep>
                ))}
              </ol>
              <p className={styles.methodAction}>
                <TextLink href="/methode">Découvrir toute la méthode</TextLink>
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ----------------------- 9 · FAQ ----------------------- */}
      <Section surface="raised" ruled>
        <Container>
          <div className={styles.faqLayout}>
            <SectionHeading
              eyebrow="Questions fréquentes"
              title="Ce que l’on nous demande le plus souvent."
            />
            <FAQAccordion items={faq} />
          </div>
        </Container>
      </Section>

      {/* -------------------- 10 · CTA final -------------------- */}
      <Section surface="inverse">
        <Container>
          <CallToAction
            eyebrow="Votre activité mérite un parcours à sa hauteur"
            title="Parlons de ce qui freine aujourd’hui votre développement."
            reassurance={reassurance}
          >
            Présentez-nous votre fonctionnement actuel. Nous identifierons les améliorations
            les plus utiles pour votre activité.
          </CallToAction>
        </Container>
      </Section>
    </>
  );
}
