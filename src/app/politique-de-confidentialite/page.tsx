import type { Metadata } from 'next';
import Link from 'next/link';

import { DarkPageShell } from '@/components/editorial/DarkPageShell';
import { EditorialHeader } from '@/components/editorial/EditorialHeader';
import { LegalSections } from '@/components/editorial/LegalSections';
import { JsonLd } from '@/components/seo/JsonLd';

import { processors, tracking } from '@/content/company';
import { privacyPage, privacySections } from '@/content/legal';
import { breadcrumbList } from '@/lib/structured-data';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata('/politique-de-confidentialite');

/**
 * Politique de confidentialité — refonte à la charte sombre (22/08/2026).
 *
 * **Les neuf sections de `content/legal.ts` sont reprises telles quelles.**
 * Aucun paragraphe n'est réécrit : ce fichier met en forme, il ne rédige pas.
 *
 * **Le bandeau d'engagements n'est pas une promesse marketing.** Chacun de ses
 * trois points est une affirmation vérifiable dans le code, et non un argument
 * commercial : `tracking.cookies` est vide, `tracking.analytics` vaut `null`,
 * et `processors` ne liste que l'hébergeur. Ces valeurs sont lues ici plutôt
 * que recopiées, précisément pour que le jour où un outil de mesure sera
 * ajouté, le bandeau cesse de l'affirmer au lieu de mentir en silence.
 */
export default function PolitiqueConfidentialitePage() {
  /*
   * Les engagements affichés dépendent de l'état réel de la configuration.
   * Un `false` fait disparaître la ligne : mieux vaut un bandeau plus court
   * qu'une affirmation devenue fausse.
   */
  const commitments = [
    {
      shown: tracking.cookies.length === 0,
      label: 'Aucun cookie',
      detail: 'Ni publicitaire, ni de mesure, ni de préférence.',
    },
    {
      shown: tracking.analytics === null,
      label: 'Aucune mesure d’audience',
      detail: 'Aucun outil de suivi n’est installé sur le site.',
    },
    {
      shown: processors.length <= 1,
      label: 'Aucune revente',
      detail: 'Vos données ne sont ni vendues, ni cédées à des tiers.',
    },
  ].filter((item) => item.shown);

  return (
    <DarkPageShell breadcrumb="Confidentialité">
      <JsonLd
        data={breadcrumbList([
          { name: 'Accueil', path: '/' },
          { name: 'Politique de confidentialité', path: '/politique-de-confidentialite' },
        ])}
      />

      <EditorialHeader
        eyebrow={privacyPage.eyebrow}
        title={privacyPage.title}
        lead={privacyPage.lead}
      >
        {commitments.length > 0 ? (
          <ul className="mt-8 grid max-w-[40rem] gap-2.5 sm:grid-cols-3">
            {commitments.map((item) => (
              <li
                key={item.label}
                className="rounded-2xl border border-hairline px-4 py-3.5"
              >
                <p className="mb-1 flex items-center gap-2 text-[0.875rem] font-semibold text-primary">
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ background: 'var(--accent-2)' }}
                  />
                  {item.label}
                </p>
                <p className="text-[0.8125rem] leading-[1.5] text-faint">{item.detail}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </EditorialHeader>

      <LegalSections
        sections={[
          ...privacySections.map((section) => ({
            id: section.id,
            title: section.title,
            paragraphs: section.paragraphs,
            body: section.items ? (
              <ul className="mt-3 grid gap-2">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 text-[0.9375rem] leading-[1.6] text-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[0.55rem] size-1 shrink-0 rounded-full bg-white/25"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : undefined,
          })),
          {
            id: 'reclamation',
            title: 'Réclamation',
            paragraphs: [
              'Pour exercer vos droits ou signaler un manquement, écrivez-nous : nous répondons à chaque demande.',
              'Si la réponse ne vous satisfait pas, vous pouvez saisir la Commission nationale de l’informatique et des libertés (CNIL), autorité de contrôle compétente en France.',
            ],
            body: (
              <ul className="mt-1 grid gap-2.5">
                {[
                  { href: '/contact', label: 'Nous écrire' },
                  { href: '/mentions-legales', label: 'Mentions légales' },
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
    </DarkPageShell>
  );
}
