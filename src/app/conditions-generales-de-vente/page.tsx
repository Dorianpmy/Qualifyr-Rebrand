import type { Metadata } from 'next';
import Link from 'next/link';

import { DarkPageShell } from '@/components/editorial/DarkPageShell';
import { EditorialHeader } from '@/components/editorial/EditorialHeader';
import { LegalNav } from '@/components/editorial/LegalNav';
import { LegalSections } from '@/components/editorial/LegalSections';
import { JsonLd } from '@/components/seo/JsonLd';

import { legalNoticeIsComplete } from '@/content/company';
import { termsIntro, termsSections, termsUpdatedAt } from '@/content/terms';
import { breadcrumbList } from '@/lib/structured-data';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata('/conditions-generales-de-vente');

/**
 * Conditions générales de vente — refonte à la charte sombre (22/08/2026).
 *
 * **Le contenu juridique est repris mot pour mot** depuis `content/terms.ts` :
 * cette page n'en modifie pas une ligne, elle le met en forme. Les neuf
 * sections d'origine sont conservées dans le même ordre, et le sommaire est
 * construit à partir d'elles — ajouter une clause au contenu la fait
 * apparaître ici sans toucher à ce fichier.
 *
 * **La date de mise à jour est désormais affichée en tête.** Sur un document
 * contractuel, savoir quelle version on lit fait partie de l'information :
 * la reléguer en bas de page, ou l'omettre comme c'était le cas, revient à
 * demander au lecteur de faire confiance sans moyen de vérifier.
 */
export default function ConditionsGeneralesPage() {
  return (
    <DarkPageShell breadcrumb="Conditions de vente" scope="legal-page">
      <JsonLd
        data={breadcrumbList([
          { name: 'Accueil', path: '/' },
          { name: 'Conditions générales de vente', path: '/conditions-generales-de-vente' },
        ])}
      />

      <EditorialHeader
        eyebrow="02 — Légal"
        title="Conditions générales de vente"
        lead={termsIntro}
        updatedAt={termsUpdatedAt}
      >
        {!legalNoticeIsComplete() ? (
          <p className="mt-7 max-w-[34rem] rounded-2xl border border-hairline px-4 py-3.5 text-[0.875rem] leading-[1.65] text-muted">
            L’identification complète du vendeur est en cours de publication. Ces conditions
            seront opposables dès qu’elle figurera aux mentions légales.
          </p>
        ) : null}
      </EditorialHeader>

      <LegalSections
        sections={[
          ...termsSections.map((section) => ({
            id: section.id,
            title: section.title,
            paragraphs: section.paragraphs,
          })),
          {
            id: 'documents-lies',
            title: 'Documents liés',
            paragraphs: [
              'L’identification du vendeur figure aux mentions légales, et le traitement des données dans la politique de confidentialité.',
            ],
            body: (
              <ul className="grid gap-2.5">
                {[
                  { href: '/mentions-legales', label: 'Mentions légales' },
                  { href: '/politique-de-confidentialite', label: 'Politique de confidentialité' },
                  { href: '/tarifs', label: 'Nos offres et leurs tarifs' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[0.9375rem] !text-muted underline decoration-white/20 underline-offset-4 transition-colors duration-150 hover:!text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ),
          },
        ]}
      />

      <LegalNav current="/conditions-generales-de-vente" />
    </DarkPageShell>
  );
}
