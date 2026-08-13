'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatMoney, roundUpToTen, swissPriceFactor, type PricingRegion } from '@/lib/offer-configurator';
import type { Route } from '@/types';
import styles from './PricingTable.module.css';

type Offer = {
  readonly kicker: string;
  readonly title: string;
  /** Montant unique, ou fourchette. Exprimés en euros. */
  readonly from: number;
  readonly to?: number;
  readonly cadence: string;
  /** Prestation d'agence : convertie en francs pour un visiteur suisse. */
  readonly convertible: boolean;
  readonly audience: string;
  readonly items: readonly string[];
  readonly href: Route | `${Route}#${string}`;
  readonly linkLabel: string;
  readonly featured?: boolean;
};

const offers: readonly Offer[] = [
  {
    kicker: 'Le plus demandé',
    title: 'Site et parcours de demande',
    from: 2200,
    to: 3800,
    cadence: 'une fois',
    convertible: true,
    audience:
      'Pour un detailer ou une activité de nettoyage auto dont la crédibilité doit être établie avant le premier échange.',
    items: [
      'Clarification de l’offre et rédaction des contenus',
      'Identité visuelle appliquée au site',
      'Parcours de demande qualifiant',
      'Référencement local et données structurées',
    ],
    href: '/diagnostic',
    linkLabel: 'Faire le diagnostic',
    featured: true,
  },
  {
    kicker: 'Entrée de gamme',
    title: 'Site vitrine',
    from: 990,
    to: 1800,
    cadence: 'une fois',
    convertible: true,
    audience:
      'Pour une activité qui a besoin d’exister en ligne proprement, sans parcours complexe.',
    items: [
      'Trois à cinq pages',
      'Structure des contenus et mise en page',
      'Formulaire de contact et fiche Google',
      'Livraison en deux à trois semaines',
    ],
    href: '/estimation',
    linkLabel: 'Obtenir une estimation',
  },
  {
    kicker: 'Abonnement',
    title: 'Module de réservation',
    from: 49,
    cadence: 'par mois',
    convertible: false,
    audience:
      'Pour recevoir des demandes de créneau structurées, sans gérer vingt messages Instagram.',
    items: [
      'Page de réservation publique (formules + véhicule + créneau)',
      'Notification email et WhatsApp à chaque demande',
      'Confirmation automatique au client',
      'Tableau de bord des demandes',
      'Essai gratuit · sans engagement long',
    ],
    href: '/nettoyage-automobile#demonstration',
    linkLabel: 'Voir la démonstration',
  },
];

function convert(amount: number, region: PricingRegion, convertible: boolean) {
  if (region !== 'switzerland' || !convertible) return amount;
  return roundUpToTen(amount * swissPriceFactor);
}

/**
 * Tarifs affichés, ajustés au pays du visiteur.
 * Sites (ponctuel) + module de réservation (abonnement).
 */
export function PricingTable() {
  const [region, setRegion] = useState<PricingRegion>('euro');

  useEffect(() => {
    let active = true;

    void fetch('/api/pricing-region')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { region?: PricingRegion } | null) => {
        if (active && data?.region) setRegion(data.region);
      })
      .catch(() => {
        // Sans réponse, on reste en euros.
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <div className={styles.offers}>
        {offers.map((offer) => (
          <article
            key={offer.title}
            className={offer.featured ? `${styles.offer} ${styles.featured}` : styles.offer}
          >
            <p className={styles.kicker}>{offer.kicker}</p>
            <h2>{offer.title}</h2>

            <p className={styles.price}>
              {offer.to
                ? `${formatMoney(convert(offer.from, region, offer.convertible), offer.convertible ? region : 'euro')} – ${formatMoney(convert(offer.to, region, offer.convertible), offer.convertible ? region : 'euro')}`
                : formatMoney(offer.from, 'euro')}
              <span>{offer.cadence}</span>
            </p>

            <p className={styles.audience}>{offer.audience}</p>

            <ul className={styles.list}>
              {offer.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <Link className={styles.link} href={offer.href}>
              {offer.linkLabel}
            </Link>
          </article>
        ))}
      </div>

      <p className={styles.note}>
        L’hébergement, le nom de domaine et les évolutions ultérieures des sites sont facturés à part
        et annoncés avant le démarrage. Le module de réservation est un abonnement mensuel facturé
        en euros, résiliable à tout moment.
        {region === 'switzerland'
          ? ' Les prestations d’agence sont affichées en francs suisses.'
          : null}
      </p>
    </>
  );
}
