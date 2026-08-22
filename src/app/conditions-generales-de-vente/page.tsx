import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { TextLink } from '@/components/ui/TextLink';
import { JsonLd } from '@/components/seo/JsonLd';

import { legalNoticeIsComplete } from '@/content/company';
import { termsIntro, termsSections } from '@/content/terms';
import { breadcrumbList } from '@/lib/structured-data';
import { buildMetadata } from '@/lib/metadata';
import styles from '../mentions-legales/page.module.css';

export const metadata: Metadata = buildMetadata('/conditions-generales-de-vente');

/**
 * Conditions générales de vente.
 *
 * **Créées le 22/08/2026, après l'audit d'avant mise en production.** Le site
 * encaissait des abonnements sans aucune condition de vente publiée — une
 * obligation d'information pour toute vente d'abonnement à distance, et la
 * dernière pièce manquante du dossier légal.
 *
 * Le texte vit dans `content/terms.ts`, comme le reste du contenu légal :
 * cette page ne fait que le mettre en forme. Elle réutilise la feuille de
 * style des mentions légales — même nature de document, aucune raison d'en
 * entretenir deux.
 *
 * **La note d'incomplétude reprend le même mécanisme que les mentions
 * légales.** Des conditions de vente valent par l'identification du vendeur :
 * tant que `legalNoticeIsComplete()` est faux, le dire franchement plutôt que
 * de laisser croire à un document opposable.
 */
export default function ConditionsGeneralesPage() {
  return (
    <Section spacing="tight">
      <Container width="reading">
        <JsonLd
          data={breadcrumbList([
            { name: 'Accueil', path: '/' },
            { name: 'Conditions générales de vente', path: '/conditions-generales-de-vente' },
          ])}
        />

        <Breadcrumbs current="Conditions générales de vente" />
        <SectionHeading
          level={1}
          eyebrow="Légal"
          title="Conditions générales de vente"
          lead={termsIntro}
          className={styles.intro}
        />

        {!legalNoticeIsComplete() ? (
          <p className={styles.notice}>
            L’identification complète du vendeur est en cours de publication. Ces conditions
            seront opposables dès qu’elle figurera aux mentions légales.
          </p>
        ) : null}

        {termsSections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className={styles.blockTitle}>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className={styles.notice}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <h2 className={styles.blockTitle}>Documents liés</h2>
        <p className={styles.notice}>
          L’identification du vendeur figure aux{' '}
          <TextLink href="/mentions-legales">mentions légales</TextLink>, et le traitement des
          données dans la{' '}
          <TextLink href="/politique-de-confidentialite">politique de confidentialité</TextLink>.
        </p>
      </Container>
    </Section>
  );
}
