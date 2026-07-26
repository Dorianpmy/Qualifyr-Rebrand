import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { TextLink } from '@/components/ui/TextLink';
import { JsonLd } from '@/components/seo/JsonLd';

import { tracking } from '@/content/company';
import { privacyPage, privacySections } from '@/content/legal';
import { breadcrumbList } from '@/lib/structured-data';
import { buildMetadata } from '@/lib/metadata';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/politique-de-confidentialite');

/**
 * Politique de confidentialité.
 *
 * Chaque affirmation correspond à ce que fait réellement le code : aucun
 * cookie, aucun outil de mesure d'audience, aucun stockage en base, aucun
 * sous-traitant en service. **Ne mentionner aucun outil qui n'est pas installé.**
 *
 * Si la configuration change — ajout d'un fournisseur d'e-mail, d'un
 * hébergeur, d'une mesure d'audience — `src/content/legal.ts` doit être mis à
 * jour dans le même commit que le code.
 */
export default function PolitiqueDeConfidentialitePage() {
  return (
    <Section spacing="tight">
      <Container width="reading">
        <JsonLd
          data={breadcrumbList([
            { name: 'Accueil', path: '/' },
            { name: 'Politique de confidentialité', path: '/politique-de-confidentialite' },
          ])}
        />

        <Breadcrumbs current={privacyPage.title} />
        <SectionHeading
          level={1}
          eyebrow={privacyPage.eyebrow}
          title={privacyPage.title}
          lead={privacyPage.lead}
          className={styles.intro}
        />

        <nav className={styles.summary} aria-label="Sommaire">
          <p className={styles.summaryTitle}>Sommaire</p>
          <ul className={styles.summaryList}>
            {privacySections.map((section) => (
              <li key={section.id}>
                <TextLink href={`#${section.id}`}>{section.title}</TextLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.sections}>
          {privacySections.map((section) => (
            <section key={section.id} id={section.id} className={styles.section}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <div className={styles.sectionBody}>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.id === 'cookies' && tracking.cookies.length > 0 ? (
                  <ul>
                    {tracking.cookies.map((cookie) => (
                      <li key={cookie.name}>
                        {cookie.name} — {cookie.purpose}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.id === 'cookies' && tracking.analytics ? (
                  <p>Mesure d’audience utilisée : {tracking.analytics}.</p>
                ) : null}
              </div>
            </section>
          ))}
        </div>

        <p className={styles.updated}>
          Cette page décrit le fonctionnement réel du site au moment de sa rédaction. Elle sera
          complétée avant la mise en ligne avec la durée de conservation des échanges et les
          prestataires techniques retenus. Voir aussi les{' '}
          <TextLink href="/mentions-legales">mentions légales</TextLink>.
        </p>
      </Container>
    </Section>
  );
}
