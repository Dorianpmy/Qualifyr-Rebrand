'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FeatureComparisonTable } from './FeatureComparisonTable';
import { Section } from './Section';

/**
 * Tarifs — trois offres, deux périodicités.
 *
 * **La carte du milieu est le produit qu'on veut vendre.** Seule, l'offre à
 * 49 € paraît chère ; encadrée par 17 € d'un côté et un pack à 59 € de
 * l'autre, elle devient la référence à partir de laquelle on compare. Le
 * visiteur qui hésite entre les deux abonnements séparés découvre qu'il paie
 * 66 € en les prenant à part, contre 59 € groupés — l'écart fait le travail
 * sans qu'on ait à insister.
 *
 * **Aucune fausse comparaison.** Les prix barrés annoncent le vrai tarif
 * mensuel, pas un tarif gonflé inventé pour créer une remise. Un professionnel
 * qui revient sur la page en mensuel doit retrouver exactement le montant
 * barré ; l'inverse se voit tout de suite et coûte plus cher que la remise ne
 * rapporte.
 *
 * **L'annuel est proposé, pas imposé.** Il est sélectionné par défaut parce
 * qu'il est plus avantageux pour le visiteur, mais la bascule est visible et
 * le montant mensuel réel reste affiché dessous — pas de « 47 €/mois » en gros
 * avec « facturé 564 € » en gris clair.
 */

type Plan = {
  readonly id: string;
  readonly kicker: string;
  readonly title: string;
  /** Tarif mensuel sans engagement, en euros. */
  readonly monthly: number;
  readonly pitch: string;
  readonly items: readonly string[];
  readonly ctaLabel: string;
  readonly ctaHref: string;
  readonly note: string;
  /** Contour dégradé et mention. Une seule carte le porte. */
  readonly featured?: boolean;
  /** Ce que coûterait la même chose achetée séparément. */
  readonly compareTo?: number;
};

/** Deux mois offerts, arrondis. Une seule déclaration pour toute la page. */
const ANNUAL_DISCOUNT = 0.2;

const plans: readonly Plan[] = [
  {
    id: 'agent',
    kicker: 'Agent seul',
    title: 'On vient vous chercher des clients',
    monthly: 17,
    pitch:
      'Votre semaine a des trous et le téléphone ne sonne pas. L’agent va démarcher votre secteur pendant que vous êtes sur un véhicule.',
    items: [
      'Il travaille toutes vos communes, pas seulement la vôtre',
      'Il vise les entreprises qui entretiennent vraiment : loueurs, VTC, concessions, flottes',
      'Il répond au premier message — vous récupérez la conversation quand elle vaut le coup',
      'Un rapport de secteur par e-mail, à lire quand vous voulez',
    ],
    ctaLabel: 'Analyser ma zone',
    ctaHref: '#agent-title',
    note: 'Première zone gratuite, sans carte bancaire.',
  },
  {
    id: 'complet',
    kicker: 'Pack complet',
    title: 'On les trouve, et on les garde',
    monthly: 59,
    compareTo: 66,
    pitch:
      'Trouver un client ne sert à rien s’il annule la veille. Ici les rendez-vous arrivent seuls et l’acompte est déjà encaissé quand vous ouvrez l’agenda.',
    items: [
      'Tout l’agent d’acquisition, sur toutes vos communes',
      'Tout le système de réservation et sa facturation',
      'Les rendez-vous trouvés par l’agent atterrissent dans le même agenda',
      'Un seul abonnement, une seule facture, un seul écran',
      'Vos questions passent devant les autres',
    ],
    ctaLabel: 'Tester le tunnel client',
    ctaHref: '#demo-title',
    note: 'Démo complète, sans inscription.',
    featured: true,
  },
  {
    id: 'saas',
    kicker: 'Système seul',
    title: 'On arrête de vous poser des lapins',
    monthly: 49,
    pitch:
      'Les demandes, vous les avez. Ce sont les devis du soir, les relances et les créneaux bloqués pour rien qui vous coûtent vos semaines.',
    items: [
      'Le client voit son prix et sa durée avant de réserver — plus de devis à rédiger',
      'L’acompte est encaissé au moment du clic : le créneau est tenu',
      'Un client qui n’a pas payé reçoit une relance automatique — le créneau n’est pas perdu en silence',
      'L’adresse est géocodée, la distance calculée, le déplacement facturé juste',
      'Vos demandes, vos avant/après et vos factures au même endroit',
      'France et Suisse : euro ou franc, TVA et mentions au bon format',
    ],
    ctaLabel: 'Voir le tableau de bord',
    ctaHref: '#demo-title',
    note: 'Sans engagement, résiliable en un clic.',
  },
];
/** Mensuel équivalent d'un abonnement annuel, arrondi à l'euro. */
function annualMonthly(monthly: number): number {
  return Math.round(monthly * (1 - ANNUAL_DISCOUNT));
}

function Check({ tinted }: { readonly tinted: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="mt-[0.3rem] size-4 shrink-0 fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]"
      style={{ stroke: tinted ? 'var(--accent-2)' : 'rgba(255,255,255,0.28)' }}
    >
      <path d="M3 8.5l3.2 3.2L13 4.8" />
    </svg>
  );
}

/**
 * Les couleurs sont posées en style en ligne, pas en utilitaires : la charte
 * historique repeint les éléments dont la classe contient « card » avec des
 * règles non calquées, qui l'emportent sur toute la couche des utilitaires.
 */
function PlanCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  const price = annual ? annualMonthly(plan.monthly) : plan.monthly;
  const yearly = annualMonthly(plan.monthly) * 12;
  const saved = plan.monthly * 12 - yearly;

  return (
    <div
      className={`flex flex-col rounded-[1.25rem] p-6 ${plan.featured ? 'border border-transparent' : ''}`}
      style={
        plan.featured
          ? {
              background:
                'linear-gradient(#121213, #121213) padding-box, linear-gradient(140deg, var(--accent-1), transparent 50%, var(--accent-2)) border-box',
            }
          : { background: '#0f0f10', border: '1px solid rgba(255,255,255,0.07)' }
      }
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-faint">
          {plan.kicker}
        </p>
        {plan.featured ? (
          <span
            className="rounded-full px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.08em]"
            style={{ backgroundColor: 'var(--accent-2)', color: '#0e0e0f' }}
          >
            Le plus pris
          </span>
        ) : null}
      </div>

      <h3 className="mb-4 text-[1.1875rem] font-bold leading-[1.25] tracking-[-0.02em] text-primary">
        {plan.title}
      </h3>

      {/* `min-h` et non `h` : une hauteur fixe coupait la ligne dès que le
          texte passait sur deux lignes, et le paragraphe suivant venait se
          poser par-dessus. */}
      <div className="mb-1 min-h-[1.25rem]">
        {annual ? (
          <p className="text-[0.8125rem] leading-[1.25rem] text-faint line-through decoration-white/25">
            {plan.monthly} € / mois
          </p>
        ) : plan.compareTo ? (
          <p className="text-[0.8125rem] leading-[1.25rem] text-faint">
            au lieu de{' '}
            <span className="line-through decoration-white/25">{plan.compareTo} €</span> séparément
          </p>
        ) : null}
      </div>

      <p className="mb-2 flex items-baseline gap-1.5">
        <span className="text-[2.25rem] font-bold leading-none tracking-[-0.035em] tabular-nums text-primary">
          {price} €
        </span>
        <span className="text-[0.9375rem] font-medium text-faint">/ mois</span>
      </p>

      <p className="mb-6 text-[0.8125rem] leading-[1.4] text-faint">
        {annual ? (
          <>
            Facturé {yearly} € par an —{' '}
            {/* Le montant économisé, pas seulement le pourcentage. « −20 % »
                demande un calcul ; « 41 € de moins » se comprend sans effort et
                se compare à quelque chose de concret. */}
            <span style={{ color: 'var(--accent-2)' }}>{saved} € de moins</span>
          </>
        ) : (
          'Facturé au mois, sans engagement'
        )}
      </p>

      <p className="mb-6 text-[0.875rem] leading-[1.55] text-muted">{plan.pitch}</p>

      {/* `flex-1` sur la liste : les trois cartes n'ont pas le même nombre de
          lignes, et sans cela les boutons finissent à des hauteurs
          différentes — ce qui donne l'impression d'une grille cassée. */}
      <ul className="mb-7 grid flex-1 content-start gap-2.5 border-t border-hairline pt-6">
        {plan.items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[0.875rem] leading-[1.5] text-muted">
            <Check tinted={plan.featured === true} />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <Link
        href={plan.ctaHref}
        className={
          plan.featured
            ? 'cta-solid accent-glow inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-5 text-center text-[0.875rem] font-semibold text-ink no-underline transition-colors duration-150 hover:bg-white/90'
            : 'inline-flex min-h-[44px] items-center justify-center rounded-full px-5 text-center text-[0.875rem] font-semibold !text-primary no-underline transition-colors duration-150 hover:bg-white/[0.06]'
        }
        style={plan.featured ? undefined : { border: '1px solid rgba(255,255,255,0.15)' }}
      >
        {plan.ctaLabel}
      </Link>

      <p className="mt-3 text-center text-[0.75rem] leading-[1.4] text-faint">{plan.note}</p>
    </div>
  );
}

export function DarkPricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <Section labelledBy="pricing-title" glow="center" glowIntensity="soft" className="border-t border-hairline py-24">
      <header className="mx-auto mb-10 max-w-[46rem] text-center">
        <p className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-faint">
          Tarifs
        </p>
        <h2
          id="pricing-title"
          className="mb-5 text-[clamp(1.75rem,3.6vw,2.6rem)] font-bold leading-[1.14] tracking-[-0.025em] text-primary"
        >
          Deux problèmes, trois façons de les régler.
        </h2>
        <p className="mx-auto max-w-[34rem] text-[1.0625rem] leading-[1.65] text-muted">
          Commencez par une zone gratuite. Vous passez à un abonnement quand votre agenda vous y
          oblige, pas avant.
        </p>
      </header>

      {/* La bascule. Deux vrais boutons dans un `radiogroup` : construite avec
          des `div` cliquables, elle serait muette au clavier et pour un
          lecteur d'écran.

          Le style vit dans `tailwind.css` sous `.period-switch`. Trois
          tentatives par utilitaires et par styles en ligne avaient échoué —
          les deux libellés restaient collés, sans état actif. */}
      <div className="mb-10 flex justify-center">
        <div role="radiogroup" aria-label="Périodicité de facturation" className="period-switch">
          {[
            { value: false, label: 'Mensuel' },
            { value: true, label: 'Annuel' },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={annual === option.value}
              onClick={() => setAnnual(option.value)}
              className="period-option"
            >
              {option.label}
              {option.value ? <span className="period-badge">−20 %</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-[58rem] items-stretch gap-3.5 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} annual={annual} />
        ))}
      </div>

      {/* Pour qui hésite entre deux offres une fois convaincu — voir le
          commentaire en tête de `FeatureComparisonTable`. */}
      <FeatureComparisonTable />

      {/* Les trois réassurances qui lèvent les objections restantes, au moment
          où le visiteur a le curseur sur un bouton. */}
      <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {[
          'Sans carte bancaire pour tester',
          'Résiliable en un clic',
          'Vos données restent les vôtres',
        ].map((item) => (
          <li key={item} className="flex items-center gap-2 text-[0.875rem] text-muted">
            <Check tinted />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <p className="mx-auto mt-8 max-w-[40rem] text-center text-[0.8125rem] leading-[1.6] text-faint">
        Prix hors taxes, facturés en euros. En Suisse, la TVA s’applique au taux local. L’annuel est
        payé en une fois ; le mensuel se résilie sans préavis ni frais.
      </p>
    </Section>
  );
}
