import type { Metadata } from 'next';
import Link from 'next/link';

import { EstimationWizard } from '@/components/agency/EstimationWizard';
import { Section } from '@/components/agency/Section';
import { DarkPageShell } from '@/components/editorial/DarkPageShell';
import { EditorialHeader } from '@/components/editorial/EditorialHeader';
import { JsonLd } from '@/components/seo/JsonLd';

import { breadcrumbList } from '@/lib/structured-data';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata('/estimation');

/**
 * Estimation — refonte complète du parcours (22/08/2026).
 *
 * ## Ce qui a changé, et pourquoi
 *
 * **La page ne chiffrait pas la bonne chose.** L'ancien configurateur
 * appliquait une grille de prestation d'agence — 590 € de mise en place puis
 * 149 €/mois pendant douze mois — qui n'existait nulle part ailleurs sur le
 * site. `/tarifs` annonçait 690–1290 € pour la même prestation, et `geo.ts`
 * parlait d'abonnements à 17, 49 et 59 €. Trois grilles, trois montants
 * différents pour un visiteur qui passe d'une page à l'autre.
 *
 * **Elle n'envoyait rien.** Le calcul se faisait sur l'appareil et s'arrêtait
 * là : aucune demande n'arrivait, rien n'était enregistré. C'était honnêtement
 * dit sur la page, mais cela signifiait qu'un prospect motivé repartait sans
 * qu'on le sache. `/api/estimation` existe désormais et reprend le traitement
 * éprouvé de `/api/contact` — limite de débit, validation, anti-robot, accusé
 * de réception.
 *
 * **Elle recommandait des options, pas une offre.** Le prospect cochait des
 * suppléments sans savoir lequel des cinq produits lui correspondait. Le
 * parcours pose maintenant huit questions et conclut par une offre nommée,
 * avec son prix, ce qu'elle contient et — surtout — ce qu'elle ne contient
 * pas.
 *
 * ## Ce qui n'a pas changé
 *
 * La direction artistique, la coque `DarkPageShell`, la portée
 * `.estimation-page` et le fil d'Ariane. Les offres et leurs prix vivent dans
 * `content/estimation-offers.ts` ; la logique de recommandation dans
 * `lib/estimation.ts`, sans React ni réseau, couverte par
 * `tests/estimation.test.ts`.
 *
 * ⚠️ La grille appliquée ici est plus basse que celle du reste du site —
 * décision prise en connaissance de cause, documentée dans
 * `content/estimation-offers.ts`.
 */

const reassurance = [
  {
    number: '01',
    title: 'Huit questions',
    body: 'Votre activité, vos demandes actuelles, ce qui vous coûte du temps.',
  },
  {
    number: '02',
    title: 'Une offre nommée',
    body: 'Pas une liste d’options : le produit qui correspond, avec son prix.',
  },
  {
    number: '03',
    title: 'Ce qui n’est pas inclus',
    body: 'Dit aussi clairement que le reste. Une estimation n’est pas une page de vente.',
  },
] as const;

export default function EstimationPage() {
  return (
    <DarkPageShell breadcrumb="Estimation" scope="estimation-page">
      <JsonLd
        data={breadcrumbList([
          { name: 'Accueil', path: '/' },
          { name: 'Estimation', path: '/estimation' },
        ])}
      />

      <EditorialHeader
        eyebrow="Estimation"
        title="Trouvez la solution adaptée à votre activité."
        lead="Répondez à quelques questions pour découvrir les outils dont vous avez réellement besoin et obtenir une estimation claire, sans engagement."
      >
        <ul className="mt-8 grid max-w-[40rem] gap-2.5 sm:grid-cols-3">
          {reassurance.map((step) => (
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
        <EstimationWizard />
      </Section>

      {/* Cette mise au point arrive après le parcours, au moment où le
          visiteur a sa recommandation en tête et se demande ce qui se passe
          ensuite. Elle a changé de contenu avec la page : avant, elle
          expliquait que rien n'était envoyé — c'est désormais l'inverse, et le
          taire serait pire que de l'avoir tu quand c'était vrai. */}
      <Section className="border-t border-hairline py-14">
        <div className="max-w-[38rem]">
          <h2 className="mb-4 text-[1.375rem] font-bold leading-[1.2] tracking-[-0.02em] text-primary">
            Ce que devient votre estimation
          </h2>

          <p className="mb-3.5 text-[0.9375rem] leading-[1.75] text-muted">
            Le parcours calcule votre recommandation sur votre appareil et vous l’affiche
            immédiatement. Rien ne nous est transmis à ce stade.
          </p>

          <p className="mb-3.5 text-[0.9375rem] leading-[1.75] text-muted">
            Si vous choisissez de la recevoir par e-mail, vos coordonnées et vos réponses nous
            parviennent alors — uniquement pour vous répondre, et rien d’autre. Le détail figure
            dans notre{' '}
            <Link
              href="/politique-de-confidentialite"
              className="!text-muted underline decoration-white/20 underline-offset-4 transition-colors duration-150 hover:!text-primary"
            >
              politique de confidentialité
            </Link>
            .
          </p>

          <p className="text-[0.9375rem] leading-[1.75] text-muted">
            Le montant obtenu reste indicatif. Un projet se chiffre après un échange : périmètre,
            contenus existants, délais. C’est cet échange qui transforme une estimation en devis.
            Vous pouvez aussi{' '}
            <Link
              href="/contact"
              className="!text-muted underline decoration-white/20 underline-offset-4 transition-colors duration-150 hover:!text-primary"
            >
              nous écrire directement
            </Link>
            .
          </p>
        </div>
      </Section>
    </DarkPageShell>
  );
}
