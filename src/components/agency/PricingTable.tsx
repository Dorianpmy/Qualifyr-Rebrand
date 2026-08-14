'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatMoney, roundUpToTen, swissPriceFactor, type PricingRegion } from '@/lib/offer-configurator';
import type { Route } from '@/types';
import styles from './PricingTable.module.css';

type Offer = {
  readonly kicker: string;
  readonly title: string;
  readonly from: number;
  readonly to?: number;
  readonly cadence: string;
  readonly convertible: boolean;
  readonly audience: string;
  readonly items: readonly string[];
  readonly href: Route;
  readonly linkLabel: string;
  readonly featured?: boolean;
};

/**
 * SaaS inchangé / enrichi (couches) — sites baissés.
 * Ordre : SaaS puis offres site one-shot.
 */
const offers: readonly Offer[] = [
  {
    kicker: 'SaaS · Essentiel',
    title: 'Réservation',
    from: 49,
    cadence: 'par mois',
    convertible: false,
    audience:
      'Page client + demandes structurées. Pour démarrer sans refaire tout le site.',
    items: [
      'Page de réservation (formules, véhicule, créneau)',
      'Photos envoyées par le client',
      'Notifications email / WhatsApp',
      'Tableau de bord des demandes',
      'Essai · résiliable à tout moment',
    ],
    href: '/nettoyage-automobile',
    linkLabel: 'Voir la démo',
  },
  {
    kicker: 'SaaS · Pro',
    title: 'Réservation + atelier',
    from: 89,
    cadence: 'par mois',
    convertible: false,
    audience:
      'Tout l’Essentiel, plus la preuve visuelle et la facturation pro (FR).',
    items: [
      'Tout le plan Essentiel',
      'Galerie avant / après',
      'Factures (mentions FR, numérotation)',
      'Espace pro renforcé',
      'Priorité évolutions produit',
    ],
    href: '/nettoyage-automobile',
    linkLabel: 'Voir la démo',
    featured: true,
  },
  {
    kicker: 'Agence · Vitrine',
    title: 'Site vitrine',
    from: 690,
    to: 1290,
    cadence: 'une fois',
    convertible: true,
    audience:
      'Exister en ligne proprement, sans parcours complexe.',
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
    cadence: 'une fois',
    convertible: true,
    audience:
      'Crédibilité + conversion : offre claire, identité, demande qualifiée.',
    items: [
      'Clarification de l’offre et contenus',
      'Identité appliquée au site',
      'Parcours de demande qualifiant',
      'SEO local et données structurées',
    ],
    href: '/diagnostic',
    linkLabel: 'Faire le diagnostic',
  },
];

function convert(amount: number, region: PricingRegion, convertible: boolean) {
  if (region !== 'switzerland' || !convertible) return amount;
  return roundUpToTen(amount * swissPriceFactor);
}

export function PricingTable() {
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
    <>
      <div className={styles.offers}>
        {offers.map((offer) => (
          <article
            key={`${offer.kicker}-${offer.title}`}
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
        et annoncés avant le démarrage. Les abonnements SaaS sont en euros, résiliables à tout moment.
        {region === 'switzerland'
          ? ' Les prestations d’agence sont affichées en francs suisses.'
          : null}
      </p>
    </>
  );
}
