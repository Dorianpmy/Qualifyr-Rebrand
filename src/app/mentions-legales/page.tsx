import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { TextLink } from '@/components/ui/TextLink';
import { JsonLd } from '@/components/seo/JsonLd';

import { company, legalNoticeIsComplete } from '@/content/company';
import { legalNoticePage } from '@/content/legal';
import { breadcrumbList } from '@/lib/structured-data';
import { buildMetadata } from '@/lib/metadata';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/mentions-legales');

type Entry = { label: string; value: string | null };

/**
 * Mentions légales.
 *
 * Toutes les valeurs viennent de `src/content/company.ts`. **Seules les
 * informations réellement renseignées sont affichées** : un champ absent
 * disparaît, il n'est jamais remplacé par un placeholder ni par une valeur
 * approchée (AGENTS.md, §6).
 *
 * Tant que l'identification de l'éditeur est incomplète, une note l'explique
 * franchement. Inventaire : `docs/07-informations-legales-requises.md`.
 */
export default function MentionsLegalesPage() {
  const publisher: Entry[] = [
    { label: 'Nom commercial', value: company.tradeName },
    { label: 'Raison sociale', value: company.legalName },
    { label: 'Forme juridique', value: company.legalForm },
    { label: 'Capital social', value: company.shareCapital },
    { label: 'Numéro d’immatriculation', value: company.registrationNumber },
    { label: 'Registre du commerce', value: company.registry },
    { label: 'TVA intracommunautaire', value: company.vatNumber },
    { label: 'Siège', value: company.address },
    { label: 'Directeur de la publication', value: company.publicationDirector },
    { label: 'Contact', value: company.email },
    { label: 'Téléphone', value: company.phone },
    { label: 'Site', value: company.domain },
  ];

  const hosting: Entry[] = company.hosting
    ? [
        { label: 'Hébergeur', value: company.hosting.name },
        { label: 'Adresse', value: company.hosting.address },
        { label: 'Contact', value: company.hosting.contact },
      ]
    : [];

  const shown = publisher.filter((entry): entry is Entry & { value: string } =>
    Boolean(entry.value),
  );

  return (
    <Section spacing="tight">
      <Container width="reading">
        <JsonLd
          data={breadcrumbList([
            { name: 'Accueil', path: '/' },
            { name: 'Mentions légales', path: '/mentions-legales' },
          ])}
        />

        <Breadcrumbs current={legalNoticePage.title} />
        <SectionHeading
          level={1}
          eyebrow={legalNoticePage.eyebrow}
          title={legalNoticePage.title}
          lead={legalNoticePage.lead}
          className={styles.intro}
        />

        {!legalNoticeIsComplete() ? (
          <p className={styles.notice}>{legalNoticePage.pendingNotice}</p>
        ) : null}

        <h2 className={styles.blockTitle}>Éditeur du site</h2>
        <dl className={styles.entries}>
          {shown.map((entry) => (
            <div key={entry.label} className={styles.entry}>
              <dt className={styles.entryLabel}>{entry.label}</dt>
              <dd className={styles.entryValue}>{entry.value}</dd>
            </div>
          ))}
        </dl>

        {hosting.length > 0 ? (
          <>
            <h2 className={styles.blockTitle}>Hébergement</h2>
            <dl className={styles.entries}>
              {hosting.map((entry) => (
                <div key={entry.label} className={styles.entry}>
                  <dt className={styles.entryLabel}>{entry.label}</dt>
                  <dd className={styles.entryValue}>{entry.value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}

        <h2 className={styles.blockTitle}>Propriété intellectuelle</h2>
        <p className={styles.notice}>
          Les textes, la composition et l’identité visuelle de ce site sont la propriété de
          Qualifyr Agence. Les noms et marques cités appartiennent à leurs détenteurs
          respectifs. Les polices de caractères Newsreader et Manrope sont utilisées sous
          licence SIL Open Font License 1.1.
        </p>

        <h2 className={styles.blockTitle}>Données personnelles</h2>
        <p className={styles.notice}>
          Le traitement des données transmises par les formulaires est décrit dans la{' '}
          <TextLink href="/politique-de-confidentialite">
            politique de confidentialité
          </TextLink>
          .
        </p>
      </Container>
    </Section>
  );
}
