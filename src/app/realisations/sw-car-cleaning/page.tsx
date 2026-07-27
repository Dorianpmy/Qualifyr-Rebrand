import type { Metadata } from 'next';
import Image from 'next/image';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { CallToAction } from '@/components/editorial/CallToAction';
import { CaseGallery } from '@/components/editorial/CaseGallery';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { JsonLd } from '@/components/seo/JsonLd';
import { TextLink } from '@/components/ui/TextLink';

import {
  caseCta,
  casePage,
  context,
  deliverables,
  lesson,
  objectives,
  swCarCleaning,
} from '@/content/sw-car-cleaning';
import { buildMetadata } from '@/lib/metadata';
import { breadcrumbList } from '@/lib/structured-data';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/realisations/sw-car-cleaning');

/**
 * Étude de cas SW Carcleaning.
 *
 * Réalisation réelle. **Aucun résultat n'est affiché** : ni pourcentage, ni
 * chiffre d'affaires, ni hausse de réservations, ni nombre de visiteurs, ni
 * témoignage, ni date, ni fonctionnalité non confirmée (AGENTS.md, §6).
 *
 * Le contenu de la section « Travail réalisé » découle exclusivement de la
 * description validée par Dorian ; chaque entrée porte, dans
 * `src/content/sw-car-cleaning.ts`, la portion de phrase qui la justifie.
 *
 * Une capture réelle du site public est affichée dans le hero et la galerie.
 * Les photographies et le logo source restent inventoriés dans `docs/06-assets-sw-car-cleaning.md`.
 */
export default function SwCarCleaningPage() {
  return (
    <>
      {/* ------------------------- Hero ------------------------- */}
      <Section spacing="tight">
        <Container>
          <JsonLd
            data={breadcrumbList([
              { name: 'Accueil', path: '/' },
              { name: 'Réalisations', path: '/realisations' },
              { name: 'SW Carcleaning', path: '/realisations/sw-car-cleaning' },
            ])}
          />
          <Breadcrumbs
            trail={[
              { label: 'Accueil', href: '/' },
              { label: 'Réalisations', href: '/realisations' },
            ]}
            current={casePage.title}
          />

          <div className={styles.hero}>
            <div className={styles.heroText}>
              <Eyebrow>{casePage.eyebrow}</Eyebrow>
              <h1 className={styles.heroTitle}>{casePage.title}</h1>
              <p className={styles.heroSubtitle}>{casePage.subtitle}</p>
              {swCarCleaning.externalUrl ? (
                <p className={styles.heroLink}>
                  <TextLink externalHref={swCarCleaning.externalUrl}>
                    Voir le site du projet
                  </TextLink>
                </p>
              ) : null}
            </div>

            <a
              className={styles.sitePreview}
              href={swCarCleaning.externalUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Voir le site SW Carcleaning"
            >
              <Image
                src={swCarCleaning.gallery[0].src}
                alt={swCarCleaning.gallery[0].alt}
                width={swCarCleaning.gallery[0].width}
                height={swCarCleaning.gallery[0].height}
                priority
                sizes="(min-width: 62rem) 55vw, 100vw"
              />
            </a>
          </div>
        </Container>
      </Section>

      {/* ----------------------- Contexte ----------------------- */}
      <Section surface="raised" ruled>
        <Container>
          <SectionHeading eyebrow="Contexte" title={context.title} />
          <div className={styles.contextLayout}>
            <div className={styles.contextText}>
              {context.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <dl className={styles.aspects}>
              {context.aspects.map((aspect) => (
                <div key={aspect.label} className={styles.aspect}>
                  <dt className={styles.aspectLabel}>{aspect.label}</dt>
                  <dd className={styles.aspectValue}>{aspect.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </Section>

      {/* ---------------------- Objectifs ----------------------- */}
      <Section>
        <Container>
          <SectionHeading
            split
            eyebrow="Objectifs"
            title="Ce que le projet cherchait à obtenir."
            lead="Ces objectifs ont guidé la conception. Ils décrivent une intention de départ, et non des résultats mesurés : aucune donnée de performance n’a été relevée."
          />
          <ol className={styles.objectives}>
            {objectives.map((objective) => (
              <li key={objective.number} className={styles.objective}>
                <span className={styles.objectiveNumber}>{objective.number}</span>
                <h3 className={styles.objectiveTitle}>{objective.title}</h3>
                <p className={styles.objectiveBody}>{objective.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* -------------------- Travail réalisé -------------------- */}
      <Section ruled spacing="tight">
        <Container>
          <SectionHeading eyebrow="Travail réalisé" title="Ce qui a été conçu." />
          <div className={styles.deliverables}>
            {deliverables.map((item) => (
              <article key={item.number} className={styles.deliverable}>
                <span className={styles.deliverableNumber}>{item.number}</span>
                <h3 className={styles.deliverableTitle}>{item.title}</h3>
                <p className={styles.deliverableBody}>{item.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* ------------------- Détails visuels -------------------- */}
      {swCarCleaning.gallery.length > 0 ? (
        <Section surface="sunken">
          <Container>
            <SectionHeading eyebrow="Détails visuels" title="Le projet en images." />
            <CaseGallery items={swCarCleaning.gallery} />
          </Container>
        </Section>
      ) : null}

      {/* ---------------------- Enseignement --------------------- */}
      <Section surface="raised" ruled>
        <Container>
          <div className={styles.lessonLayout}>
            <SectionHeading eyebrow="Enseignement" title={lesson.title} />
            <p className={styles.lessonBody}>{lesson.body}</p>
            <ol className={styles.links}>
              {lesson.links.map((link) => (
                <li key={link.number} className={styles.link}>
                  <h3 className={styles.linkTitle}>
                    {link.number} — {link.title}
                  </h3>
                  <p className={styles.linkBody}>{link.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      {/* ------------------------- CTA -------------------------- */}
      <Section>
        <Container>
          <CallToAction light eyebrow={caseCta.eyebrow} title={caseCta.title}>
            {caseCta.body}
          </CallToAction>
        </Container>
      </Section>
    </>
  );
}
