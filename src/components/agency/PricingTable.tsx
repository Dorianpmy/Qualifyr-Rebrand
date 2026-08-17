'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatMoney, roundUpToTen, swissPriceFactor, type PricingRegion } from '@/lib/offer-configurator';
import type { Route } from '@/types';
import { SubscribeButton } from './SubscribeButton';
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
  /** Présent uniquement sur les 3 offres SaaS : fait apparaître le bouton
      « S'abonner directement » (voir `SubscribeButton.tsx`). Les 2 offres
      d'agence, vendues sur devis, n'ont pas d'équivalent en paiement direct. */
  readonly billingPlan?: 'agent' | 'complet' | 'systeme';
};

/**
 * SaaS puis offres site one-shot.
 *
 * Les trois premières entrées reprennent mot pour mot les trois offres SaaS
 * affichées sur `/` et `/nettoyage-automobile` (`DarkPricing.tsx`) — mêmes
 * noms, mêmes prix mensuels, mêmes contenus. Cette page affichait jusqu'ici
 * une quatrième offre SaaS différente (« Réservation + atelier », 49 €/mois
 * en un seul palier) : un prospect qui comparait cette page à l'accueil
 * voyait deux grilles tarifaires incompatibles pour ce qui est le même
 * produit. Les prix ici sont les tarifs mensuels sans engagement (la bascule
 * annuelle avec remise −20 % reste sur `/` et `/nettoyage-automobile`, qui
 * gardent le comparatif complet) : les montants doivent rester identiques
 * dans les deux endroits si l'un des deux change.
 */
const offers: readonly Offer[] = [
  {
    kicker: 'SaaS · Agent seul',
    title: 'On vient vous chercher des clients',
    from: 17,
    cadence: 'par mois',
    convertible: false,
    audience:
      'Votre semaine a des trous et le téléphone ne sonne pas. L’agent démarche votre secteur pendant que vous êtes sur un véhicule.',
    items: [
      'Il travaille toutes vos communes, pas seulement la vôtre',
      'Il vise les entreprises qui entretiennent vraiment : loueurs, VTC, concessions, flottes',
      'Il répond au premier message',
      'Un rapport de secteur par e-mail',
    ],
    href: '/nettoyage-automobile',
    linkLabel: 'Analyser ma zone',
    billingPlan: 'agent',
  },
  {
    kicker: 'SaaS · Pack complet',
    title: 'On les trouve, et on les garde',
    from: 59,
    cadence: 'par mois',
    convertible: false,
    audience:
      'Trouver un client ne sert à rien s’il annule la veille. Les rendez-vous arrivent seuls et l’acompte est déjà encaissé.',
    items: [
      'Tout l’agent d’acquisition, sur toutes vos communes',
      'Tout le système de réservation et sa facturation',
      'Les rendez-vous trouvés par l’agent atterrissent dans le même agenda',
      'Un seul abonnement, une seule facture',
    ],
    href: '/nettoyage-automobile',
    linkLabel: 'Voir la démo',
    featured: true,
    billingPlan: 'complet',
  },
  {
    kicker: 'SaaS · Système seul',
    title: 'On arrête de vous poser des lapins',
    from: 49,
    cadence: 'par mois',
    convertible: false,
    audience:
      'Les demandes, vous les avez. Ce sont les devis du soir et les créneaux bloqués pour rien qui vous coûtent vos semaines.',
    items: [
      'Prix et durée affichés avant réservation',
      'Acompte encaissé au clic',
      'Relance automatique des devis abandonnés',
      'Facturation France/Suisse',
    ],
    href: '/nettoyage-automobile',
    linkLabel: 'Voir le tableau de bord',
    billingPlan: 'systeme',
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
    href: '/contact',
    linkLabel: 'Nous contacter',
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

            {offer.billingPlan ? (
              <p className={styles.subscribeRow}>
                <SubscribeButton
                  plan={offer.billingPlan}
                  cadence="monthly"
                  className={styles.subscribeLink}
                />
              </p>
            ) : null}
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
