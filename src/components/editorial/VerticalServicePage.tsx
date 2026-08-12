import Image from 'next/image';
import { FAQAccordion } from '@/components/editorial/FAQAccordion';
import { InteractiveSitePreview } from '@/components/editorial/InteractiveSitePreview';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { CallToAction } from '@/components/editorial/CallToAction';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { ButtonLink } from '@/components/ui/Button';
import { DiagnosticLink } from '@/components/agency/DiagnosticLink';
import { Eyebrow } from '@/components/ui/Eyebrow';
import type { VerticalServiceContent } from '@/content/verticals';
import { verticalMethod } from '@/content/verticals';
import styles from './VerticalServicePage.module.css';

type VerticalServicePageProps = {
  content: VerticalServiceContent;
};

export function VerticalServicePage({ content }: VerticalServicePageProps) {
  const isConcept = content.proof.kind === 'concept';

  return (
    <>
      <Section spacing="tight" className={styles.heroSection}>
        <Container>
          <div className={styles.hero}>
            <div className={styles.heroCopy}>
              <Eyebrow>{content.hero.eyebrow}</Eyebrow>
              <h1 className={styles.heroTitle}>{content.hero.title}</h1>
              <p className={styles.heroLead}>{content.hero.lead}</p>
              <div className={styles.heroActions}>
                <DiagnosticLink
                  ctaId={content.route === '/conciergerie' ? 'concierge_diagnostic' : 'cleaning_diagnostic'}
                  analyticsVertical={content.route.slice(1)}
                  withArrow
                >
                  Présenter mon activité
                </DiagnosticLink>
                <ButtonLink href={content.hero.secondaryHref} variant="secondary">
                  {content.hero.secondaryLabel}
                </ButtonLink>
              </div>
            </div>
            <div className={styles.heroIndex} aria-label="Contenu de la page">
              <p>Une expertise pensée autour de votre fonctionnement réel.</p>
              <ol>
                <li><span>01</span> Clarifier l’offre</li>
                <li><span>02</span> Guider la demande</li>
                <li><span>03</span> Préparer l’échange</li>
              </ol>
            </div>
          </div>
        </Container>
      </Section>

      <Section surface="sunken" spacing="tight" ruled ariaLabelledBy="freins-title">
        <Container>
          <SectionHeading
            id="freins-title"
            eyebrow={content.problems.eyebrow}
            title={content.problems.title}
            lead={content.problems.lead}
            split
          />
          <ol className={styles.editorialGrid}>
            {content.problems.items.map((item) => (
              <li key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section spacing="tight" ruled ariaLabelledBy="reponse-title">
        <Container>
          <SectionHeading
            id="reponse-title"
            eyebrow={content.response.eyebrow}
            title={content.response.title}
            lead={content.response.lead}
            split
          />
          <ol className={`${styles.editorialGrid} ${styles.responseGrid}`}>
            {content.response.items.map((item) => (
              <li key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Ce que ça change — placé juste après `response` : le lecteur vient
          d'apprendre ce qu'on construit, c'est le moment exact où il se
          demande « et alors ? ». */}
      {content.outcomes ? (
        <Section surface="sunken" spacing="tight" ruled ariaLabelledBy="consequences-title">
          <Container>
            <SectionHeading
              id="consequences-title"
              eyebrow={content.outcomes.eyebrow}
              title={content.outcomes.title}
              lead={content.outcomes.lead}
              split
            />
            <ol className={`${styles.editorialGrid} ${styles.responseGrid}`}>
              {content.outcomes.items.map((item) => (
                <li key={item.number}>
                  <span>{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </li>
              ))}
            </ol>
          </Container>
        </Section>
      ) : null}

      <Section surface="raised" spacing="tight" ruled ariaLabelledBy="parcours-title">
        <Container>
          <div className={styles.journeyLayout}>
            <SectionHeading
              id="parcours-title"
              eyebrow={content.journey.eyebrow}
              title={content.journey.title}
              lead={content.journey.lead}
            />
            <ol className={styles.journey}>
              {content.journey.steps.map((step) => (
                <li key={step.number}>
                  <span>{step.number}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <Section
        surface={isConcept ? 'page' : 'inverse'}
        spacing="tight"
        ruled
        ariaLabelledBy="preuve-title"
      >
        <Container>
          <div className={isConcept ? styles.proofConcept : styles.proofReal}>
            <div className={styles.proofCopy}>
              <Eyebrow inverse={!isConcept}>{content.proof.eyebrow}</Eyebrow>
              <h2 id="preuve-title">{content.proof.title}</h2>
              <p>{content.proof.body}</p>
              <ul>
                {content.proof.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
              <ButtonLink
                href={content.proof.link}
                variant={isConcept ? 'secondary' : 'inverse'}
                withArrow
              >
                {content.proof.linkLabel}
              </ButtonLink>
            </div>
            {content.proof.kind === 'real' ? (
              /* Le site livré, chargé en direct plutôt qu'en capture : une
                 image montre ce que nous avons choisi de montrer, le site
                 laisse juger le reste. La capture reste le repli tant qu'une
                 réalisation n'a pas d'adresse publique. */
              content.proof.externalUrl ? (
                <InteractiveSitePreview
                  url={content.proof.externalUrl}
                  title={`Site ${content.proof.title}, en ligne`}
                  domain={content.proof.domain ?? content.proof.externalUrl}
                  caption="Site livré · en ligne"
                />
              ) : (
                <figure className={styles.realVisual}>
                  <Image
                    src={content.proof.image.src}
                    alt={content.proof.image.alt}
                    width={content.proof.image.width}
                    height={content.proof.image.height}
                    sizes="(max-width: 61.99rem) calc(100vw - 2.5rem), 58vw"
                  />
                  <figcaption>{content.proof.image.caption} Image réelle.</figcaption>
                </figure>
              )
            ) : (
              <div className={styles.conceptVisual} aria-hidden="true">
                <span className={styles.conceptLetter}>C</span>
                <div className={styles.conceptPanel}>
                  <span>Votre demande</span>
                  <strong>Un accompagnement clair</strong>
                  <i />
                </div>
                <ol>
                  <li>Comprendre</li>
                  <li>Préciser</li>
                  <li>Échanger</li>
                </ol>
              </div>
            )}
          </div>
        </Container>
      </Section>

      <Section spacing="tight" ruled ariaLabelledBy="methode-title">
        <Container>
          <SectionHeading
            id="methode-title"
            eyebrow="Une méthode commune"
            title="Quatre temps pour avancer sans complexité inutile."
            lead="La méthode reste la même. Les décisions et le parcours s’adaptent à votre métier."
            split
          />
          <ol className={styles.methodGrid}>
            {verticalMethod.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Pourquoi nous — dernier argument avant les objections (FAQ) et
          l'appel à l'action. Le lecteur a vu le problème, la réponse, le
          parcours, la preuve et la méthode : il ne lui reste qu'à choisir
          entre nous et une autre agence. C'est ici que ça se joue.

          Liste non numérotée : ce sont des arguments, pas des étapes. La
          numérotation impliquerait un ordre qui n'existe pas. */}
      {content.whyUs ? (
        <Section surface="sunken" spacing="tight" ruled ariaLabelledBy="pourquoi-title">
          <Container>
            <SectionHeading
              id="pourquoi-title"
              eyebrow={content.whyUs.eyebrow}
              title={content.whyUs.title}
              lead={content.whyUs.lead}
              split
            />
            <ul className={styles.methodGrid}>
              {content.whyUs.items.map((item) => (
                <li key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <Section surface="raised" spacing="tight" ruled ariaLabelledBy="faq-title">
        <Container>
          <div className={styles.faqLayout}>
            <SectionHeading
              id="faq-title"
              eyebrow="Questions fréquentes"
              title="Ce qu’il faut savoir avant d’avancer."
            />
            <FAQAccordion items={content.faq} />
          </div>
        </Container>
      </Section>

      <Section surface="inverse" spacing="tight" ruled>
        <Container>
          <CallToAction
            eyebrow={content.cta.eyebrow}
            title={content.cta.title}
            actionLabel="Présenter mon activité"
            actionHref={`/diagnostic?activity=${content.route.slice(1)}`}
            ctaId={content.route === '/conciergerie' ? 'concierge_diagnostic' : 'cleaning_diagnostic'}
          >
            <p>{content.cta.body}</p>
          </CallToAction>
        </Container>
      </Section>
    </>
  );
}
