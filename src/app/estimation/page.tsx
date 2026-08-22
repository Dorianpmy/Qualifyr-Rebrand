import type { Metadata } from 'next';
import Link from 'next/link';

import { OfferConfigurator } from '@/components/agency/OfferConfigurator';
import { Section } from '@/components/agency/Section';
import { DarkPageShell } from '@/components/editorial/DarkPageShell';
import { EditorialHeader } from '@/components/editorial/EditorialHeader';
import { JsonLd } from '@/components/seo/JsonLd';

import { breadcrumbList } from '@/lib/structured-data';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata('/estimation');

/**
 * Estimation — refonte à la charte sombre (22/08/2026).
 *
 * **Ce que fait réellement cette page, et ce qu'elle ne fait pas.** Le
 * configurateur calcule un montant **sur l'appareil du visiteur**, à partir de
 * ses trois réponses et des options cochées. Il n'envoie rien : aucune route
 * d'API n'est appelée à la validation, aucune demande n'arrive chez Dorian, et
 * il n'existe aucun enregistrement de l'estimation. Le seul appel réseau du
 * composant sert à choisir la devise (`/api/pricing-region`).
 *
 * **C'est dit sur la page, pas seulement ici.** Laisser croire qu'une demande
 * a été transmise serait la pire issue : le visiteur attendrait une réponse
 * qui ne viendrait jamais. La section « Ce que devient votre estimation »
 * l'énonce, et les deux actions de fin (WhatsApp, réservation) sont les seuls
 * moyens réels d'entrer en contact.
 *
 * Le calcul, lui, n'est pas une simulation : il est couvert par
 * `tests/offer-configurator.test.ts` (8 tests) et applique une grille réelle.
 * « Indicatif » qualifie son statut commercial — un devis reste à confirmer —
 * pas la sincérité du chiffre.
 */
const steps = [
  {
    number: '01',
    title: 'Trois réponses',
    body: 'Votre activité, votre situation actuelle, et ce qui vous bloque aujourd’hui.',
  },
  {
    number: '02',
    title: 'Les options utiles',
    body: 'Vous ajoutez seulement ce qui vous servirait. Le montant se met à jour immédiatement.',
  },
  {
    number: '03',
    title: 'Votre estimation',
    body: 'Une recommandation et un montant, dans votre devise, calculés sur votre appareil.',
  },
] as const;

export default function EstimationPage() {
  return (
    <DarkPageShell breadcrumb="Estimation">
      <JsonLd
        data={breadcrumbList([
          { name: 'Accueil', path: '/' },
          { name: 'Estimation', path: '/estimation' },
        ])}
      />

      <EditorialHeader
        eyebrow="Première estimation"
        title="Une idée du budget, avant de nous parler."
        lead="Quelques choix suffisent pour obtenir une orientation, les éléments recommandés et un montant indicatif. Sans inscription, sans engagement."
      >
        <ul className="mt-8 grid max-w-[40rem] gap-2.5 sm:grid-cols-3">
          {steps.map((step) => (
            <li key={step.number} className="rounded-2xl border border-hairline px-4 py-4">
              <p className="mb-1.5 text-[0.6875rem] font-semibold tabular-nums tracking-[0.1em] text-faint">
                {step.number}
              </p>
              <p className="mb-1 text-[0.9375rem] font-semibold leading-tight text-primary">
                {step.title}
              </p>
              <p className="text-[0.8125rem] leading-[1.5] text-faint">{step.body}</p>
            </li>
          ))}
        </ul>
      </EditorialHeader>

      <Section className="border-t border-hairline py-14">
        <OfferConfigurator showIntro={false} />
      </Section>

      {/* La mise au point qui évite le malentendu. Elle vient après le
          configurateur, au moment où le visiteur a son chiffre en tête et se
          demande ce qui se passe ensuite. */}
      <Section className="border-t border-hairline py-14">
        <div className="max-w-[38rem]">
          <h2 className="mb-4 text-[1.375rem] font-bold leading-[1.2] tracking-[-0.02em] text-primary">
            Ce que devient votre estimation
          </h2>

          <p className="mb-3.5 text-[0.9375rem] leading-[1.75] text-muted">
            Rien. Le calcul se fait sur votre appareil : aucune donnée n’est envoyée, aucune
            demande ne nous parvient, et nous ne savons pas que vous êtes passé par là.
          </p>

          <p className="mb-3.5 text-[0.9375rem] leading-[1.75] text-muted">
            Le montant obtenu est indicatif. Il repose sur une grille réelle, mais un projet se
            chiffre après un échange : périmètre, contenus existants, délais. C’est cet échange
            qui transforme une estimation en devis.
          </p>

          <p className="text-[0.9375rem] leading-[1.75] text-muted">
            Pour aller plus loin, utilisez l’un des deux boutons au-dessus, ou{' '}
            <Link
              href="/contact"
              className="!text-muted underline decoration-white/20 underline-offset-4 transition-colors duration-150 hover:!text-primary"
            >
              écrivez-nous
            </Link>
            .
          </p>
        </div>
      </Section>
    </DarkPageShell>
  );
}
