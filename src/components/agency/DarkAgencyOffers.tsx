'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  formatMoney,
  roundUpToTen,
  swissPriceFactor,
  type PricingRegion,
} from '@/lib/offer-configurator';
import { SectionHead } from './DarkVerticalPage';
import { Section } from './Section';

/**
 * Les deux offres de site, à la charte sombre.
 *
 * **Copie reprise mot pour mot de `PricingTable.tsx`.** Cette page (`/tarifs`)
 * affichait jusqu'au 22/08/2026 ces deux offres au milieu des trois offres
 * SaaS, sur l'ancienne charte claire (`Section`/`Container` de
 * `components/layout`, `PricingTable`) — copiée sans y toucher depuis la
 * première version « agence » du site, jamais alignée sur la charte sombre
 * utilisée partout ailleurs (`/`, `/fonctionnalites`, `/nettoyage-automobile`)
 * depuis le repositionnement SaaS-first. Signalé par Dorian sur capture
 * d'écran : « la page qualifyragence.com/tarifs n'est pas du tout modifié et
 * est tjs sur copier sur mon ancienne DA ». Seule la mise en forme change
 * ici — prix, libellés et contenu des offres restent identiques à
 * `PricingTable.tsx`, qui garde ces deux offres pour le comparateur
 * `/estimation`.
 *
 * **Pourquoi un composant séparé plutôt que réutiliser `DarkPricing`.**
 * `DarkPricing` n'a que les trois offres SaaS (mensuel/annuel, paiement
 * Stripe direct) — ces deux offres-ci sont vendues sur devis, en une fois,
 * sans bascule de périodicité ni bouton de paiement : la mécanique diffère
 * assez pour ne pas forcer les deux dans un seul composant.
 */

type Offer = {
  readonly kicker: string;
  readonly title: string;
  readonly from: number;
  readonly to: number;
  readonly audience: string;
  readonly items: readonly string[];
  readonly href: string;
  readonly linkLabel: string;
};

const offers: readonly Offer[] = [
  {
    kicker: 'Agence · Vitrine',
    title: 'Site vitrine',
    from: 690,
    to: 1290,
    audience: 'Exister en ligne proprement, sans parcours complexe.',
    items: [
      'Trois à cinq pages',
      'Structure des contenus et mise en page',
      'Formulaire de contact',
      'Livraison en deux à trois semaines',
    ],
    href: '/estimation',
    linkLabel: 'Obtenir une estimation',
  },
  {
    kicker: 'Agence · Complet',
    title: 'Site + parcours de demande',
    from: 1490,
    to: 2490,
    audience: 'Crédibilité + conversion : offre claire, identité, demande qualifiée.',
    items: [
      'Clarification de l’offre et contenus',
      'Identité appliquée au site',
      'Parcours de demande qualifiant',
      'SEO local et données structurées',
    ],
    href: '/contact',
    linkLabel: 'Nous contacter',
  },
];

/** Les deux offres sont converties en francs suisses — mêmes règles que
    `PricingTable.tsx` (`convert`, réservé aux offres « agence »). */
function convert(amount: number, region: PricingRegion) {
  if (region !== 'switzerland') return amount;
  return roundUpToTen(amount * swissPriceFactor);
}

function OfferCard({ offer, region }: { readonly offer: Offer; readonly region: PricingRegion }) {
  return (
    <article
      className="flex flex-col rounded-[1.25rem] p-6"
      style={{ background: '#0f0f10', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="mb-3 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-faint">
        {offer.kicker}
      </p>
      <h3 className="mb-3 text-[1.1875rem] font-bold leading-[1.22] tracking-[-0.02em] text-primary">
        {offer.title}
      </h3>

      <p className="mb-4 flex items-baseline gap-1.5">
        <span className="text-[1.5rem] font-bold leading-none tracking-[-0.025em] tabular-nums text-primary">
          {formatMoney(convert(offer.from, region), region)} –{' '}
          {formatMoney(convert(offer.to, region), region)}
        </span>
        <span className="text-[0.8125rem] font-medium text-faint">une fois</span>
      </p>

      <p className="mb-4 text-[0.875rem] leading-[1.5] text-muted">{offer.audience}</p>

      <ul className="mb-6 grid flex-1 content-start gap-2 border-t border-hairline pt-4">
        {offer.items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[0.875rem] leading-[1.4] text-muted">
            <span
              aria-hidden="true"
              className="mt-[0.45rem] size-1.5 shrink-0 rounded-full"
              style={{ background: 'var(--accent-2)' }}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <Link
        href={offer.href}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full px-5 text-center text-[0.875rem] font-semibold !text-primary no-underline transition-colors duration-150 hover:bg-white/[0.06]"
        style={{ border: '1px solid rgba(255,255,255,0.15)' }}
      >
        {offer.linkLabel}
      </Link>
    </article>
  );
}

export function DarkAgencyOffers() {
  const [region, setRegion] = useState<PricingRegion>('euro');

  useEffect(() => {
    let active = true;

    void fetch('/api/pricing-region')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { region?: PricingRegion } | null) => {
        if (active && data?.region) setRegion(data.region);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return (
    <Section labelledBy="agency-offers-title" className="border-t border-hairline py-24">
      <SectionHead
        eyebrow="En plus du logiciel"
        title="Besoin d’un site, en une fois ?"
        lead="Le logiciel se loue au mois, sans engagement. Un site sur mesure — vitrine ou parcours de demande complet — se vend séparément, à devis."
        id="agency-offers-title"
      />

      <div className="mx-auto grid max-w-[46rem] gap-4 sm:grid-cols-2">
        {offers.map((offer) => (
          <OfferCard key={offer.title} offer={offer} region={region} />
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-[40rem] text-center text-[0.8125rem] leading-[1.6] text-faint">
        L’hébergement, le nom de domaine et les évolutions ultérieures des sites sont facturés à part
        et annoncés avant le démarrage.
        {region === 'switzerland' ? ' Prix affichés en francs suisses.' : ''}
      </p>
    </Section>
  );
}
