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
  /** Prestation d'agence : convertie en francs pour un visiteur suisse.
   *  Le produit en abonnement, lui, est facturé en euros par Stripe. */
  readonly convertible: boolean;
  readonly audience: string;
  readonly items: readonly string[];
  readonly href: Route;
  readonly linkLabel: string;
  readonly featured?: boolean;
};

const offers: readonly Offer[] = [
  {
    kicker: 'Produit',
    title: 'Outil d’acquisition',
    from: 79,
    cadence: 'par mois',
    convertible: false,
    audience:
      'Pour une conciergerie qui veut des demandes de propriétaires, sans projet ni accompagnement.',
    items: [
      'Page publique avec simulateur de revenus',
      'Vos secteurs et vos barèmes',
      'Tableau de bord et notifications',
      'En ligne en dix minutes, essai gratuit',
    ],
    href: '/outil-conciergerie',
    linkLabel: 'Découvrir l’outil',
  },
  {
    kicker: 'Le plus demandé',
    title: 'Site et parcours de demande',
    from: 2200,
    to: 3800,
    cadence: 'une fois',
    convertible: true,
    audience:
      'Pour une entreprise de services dont la crédibilité doit être établie avant le premier échange.',
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
];

function convert(amount: number, region: PricingRegion, convertible: boolean) {
  if (region !== 'switzerland' || !convertible) return amount;
  return roundUpToTen(amount * swissPriceFactor);
}

/**
 * Tarifs affichés, ajustés au pays du visiteur.
 *
 * La région est déterminée côté serveur à partir de l'en-tête pays fourni par
 * l'hébergeur, jamais par un choix manuel : l'euro reste la valeur par défaut,
 * et la conversion en francs n'intervient que pour une visite depuis la Suisse.
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
        // Sans réponse, on reste en euros : l'affichage par défaut est correct
        // pour l'immense majorité des visiteurs.
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
        L’hébergement, le nom de domaine et les évolutions ultérieures sont facturés à part et
        annoncés avant le démarrage. Aucun abonnement caché sur les prestations ponctuelles.
        {region === 'switzerland'
          ? ' Les prestations d’agence sont affichées en francs suisses ; l’abonnement à l’outil est facturé en euros.'
          : null}
      </p>
    </>
  );
}
