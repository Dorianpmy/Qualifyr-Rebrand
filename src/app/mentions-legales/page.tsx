import type { Metadata } from 'next';
import Link from 'next/link';

import { DarkPageShell } from '@/components/editorial/DarkPageShell';
import { EditorialHeader } from '@/components/editorial/EditorialHeader';
import { LegalNav } from '@/components/editorial/LegalNav';
import { DataBlock, LegalSections } from '@/components/editorial/LegalSections';
import { JsonLd } from '@/components/seo/JsonLd';

import { company, legalNoticeIsComplete } from '@/content/company';
import { legalNoticePage } from '@/content/legal';
import { breadcrumbList } from '@/lib/structured-data';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata('/mentions-legales');

/**
 * Mentions légales — refonte à la charte sombre (22/08/2026).
 *
 * **Cette page appartenait encore à l'ancienne identité.** Comme les quatre
 * autres pages refondues le même jour, elle utilisait `Section`/`Container` de
 * `components/layout` et, faute de porter `data-theme="dark"`, conservait
 * l'en-tête et le pied de page clairs — voir `DarkPageShell` pour le détail du
 * mécanisme.
 *
 * **Aucune information juridique n'a été modifiée.** Toutes les valeurs
 * viennent toujours de `src/content/company.ts`, et la règle du projet est
 * inchangée : un champ absent s'affiche comme « à publier », il n'est jamais
 * inventé ni remplacé par un texte de remplissage. `DataBlock` rend cette
 * absence visible plutôt que de masquer la ligne — sur des mentions légales,
 * le lecteur doit pouvoir constater ce qui manque.
 */
export default function MentionsLegalesPage() {
  /*
   * Les lignes sans objet sont retirées, pas affichées comme manquantes.
   *
   * « Capital social » et « Registre du commerce » s'affichaient « À publier
   * avant la mise en ligne » — ce qui était faux et inquiétant : un
   * entrepreneur individuel **n'a pas** de capital social, et n'est pas
   * immatriculé au registre du commerce et des sociétés. Annoncer une
   * information à venir qui n'existera jamais donne l'impression de mentions
   * incomplètes alors qu'elles sont complètes pour ce statut.
   *
   * `filter` sur `null` plutôt que sur une liste de libellés : le jour où la
   * structure changerait de forme juridique, la ligne réapparaîtrait d'
   * elle-même en même temps que la valeur.
   */
  const publisher = [
    { label: 'Nom commercial', value: company.tradeName },
    { label: 'Raison sociale', value: company.legalName },
    { label: 'Forme juridique', value: company.legalForm },
    { label: 'Capital social', value: company.shareCapital },
    { label: 'Immatriculation', value: company.registrationNumber },
    { label: 'Registre du commerce', value: company.registry },
    { label: 'TVA intracommunautaire', value: company.vatNumber },
    { label: 'Siège', value: company.address },
  ].filter((entry) => entry.value !== null);

  const contactEntries = [
    { label: 'Directeur de la publication', value: company.publicationDirector },
    { label: 'Contact', value: company.email },
    { label: 'Téléphone', value: company.phone },
    { label: 'Site', value: company.domain },
  ] as const;

  const hosting = company.hosting
    ? ([
        { label: 'Raison sociale', value: company.hosting.name },
        { label: 'Adresse', value: company.hosting.address },
        { label: 'Contact', value: company.hosting.contact },
      ] as const)
    : ([{ label: 'Hébergeur', value: null }] as const);

  return (
    <DarkPageShell breadcrumb="Mentions légales" scope="legal-page">
      <JsonLd
        data={breadcrumbList([
          { name: 'Accueil', path: '/' },
          { name: 'Mentions légales', path: '/mentions-legales' },
        ])}
      />

      <EditorialHeader
        eyebrow="01 — Légal"
        title={legalNoticePage.title}
        lead={legalNoticePage.lead}
      >
        {!legalNoticeIsComplete() ? (
          <p className="mt-7 max-w-[34rem] rounded-2xl border border-hairline px-4 py-3.5 text-[0.875rem] leading-[1.65] text-muted">
            {legalNoticePage.pendingNotice}
          </p>
        ) : null}
      </EditorialHeader>

      <LegalSections
        sections={[
          {
            id: 'editeur',
            title: 'Éditeur du site',
            paragraphs: [
              'Le site est édité par la structure identifiée ci-dessous. Ces informations proviennent du registre officiel des entreprises.',
            ],
            body: <DataBlock entries={publisher} />,
          },
          {
            id: 'publication',
            title: 'Publication et contact',
            paragraphs: [
              'Le directeur de la publication est responsable du contenu éditorial du site. Toute demande relative à ce contenu peut être adressée à l’adresse ci-dessous.',
            ],
            body: <DataBlock entries={contactEntries} />,
          },
          {
            id: 'hebergement',
            title: 'Hébergement',
            paragraphs: [
              'Le site est hébergé par la société suivante. Mentionner l’hébergeur est une obligation de l’article 6 de la loi pour la confiance dans l’économie numérique.',
            ],
            body: <DataBlock entries={hosting} />,
          },
          {
            id: 'propriete',
            title: 'Propriété intellectuelle',
            paragraphs: [
              'Les textes, la composition et l’identité visuelle de ce site sont la propriété de Qualifyr Agence. Les noms et marques cités appartiennent à leurs détenteurs respectifs.',
              'Les polices de caractères Cormorant Garamond et Manrope sont utilisées sous licence SIL Open Font License 1.1.',
            ],
          },
          {
            id: 'responsabilite',
            title: 'Responsabilité',
            paragraphs: [
              'Les informations publiées sur ce site sont fournies à titre indicatif et peuvent évoluer. Les tarifs affichés engagent l’éditeur dans les conditions décrites aux conditions générales de vente.',
              'Le site peut renvoyer vers des sites tiers, sur lesquels l’éditeur n’exerce aucun contrôle et dont il ne peut être tenu responsable du contenu.',
            ],
          },
          {
            id: 'liens',
            title: 'Documents liés',
            body: (
              <ul className="grid gap-2.5">
                {[
                  { href: '/conditions-generales-de-vente', label: 'Conditions générales de vente' },
                  { href: '/politique-de-confidentialite', label: 'Politique de confidentialité' },
                  { href: '/contact', label: 'Nous écrire' },
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

      <LegalNav current="/mentions-legales" />
    </DarkPageShell>
  );
}
