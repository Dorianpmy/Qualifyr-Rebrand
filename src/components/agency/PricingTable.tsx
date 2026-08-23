'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatMoney, roundUpToTen, swissPriceFactor, type PricingRegion } from '@/lib/offer-configurator';
import { useCheckout } from '@/lib/billing/use-checkout';
import type { Route } from '@/types';
import { Button } from '@/components/ui/Button';
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
  /** Présent uniquement sur les 3 offres SaaS : fait apparaître le bouton de
      paiement direct (voir `useCheckout`). Les 2 offres d'agence, vendues sur
      devis, n'ont pas d'équivalent en paiement direct. */
  readonly billingPlan?: 'agent' | 'complet' | 'systeme';
  readonly subscribeLabel?: string;
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
      'Votre semaine a des trous et le téléphone ne sonne pas. L’agent recense les entreprises de votre secteur à appeler, pendant que vous êtes sur un véhicule.',
    items: [
      'Il couvre les codes postaux voisins de votre zone, pas seulement le vôtre',
      'Il vise les entreprises qui entretiennent vraiment : loueurs, VTC, concessions, flottes',
      // Corrigé le 22/08/2026 — même correction que DarkPricing.tsx :
      // « Il répond au premier message » décrivait une prise de contact
      // automatisée avec les prospects qui n'existe nulle part dans le code.
      'Chaque chiffre vient du répertoire officiel Sirene',
      'Un rapport de secteur par e-mail',
      /* Ajouté le 22/08/2026 : Hermès envoie réellement. C'est l'argument le
         plus fort de cette offre, et il n'était écrit nulle part. La
         formulation dit ce qui se passe — un premier message, à votre nom —
         sans promettre ce qui vient après : relancer et conclure restent au
         professionnel. */
      'Hermès écrit à ces entreprises pour vous, à votre nom',
      'Vous recevez les réponses directement, vous décidez de la suite',
    ],
    href: '/nettoyage-automobile',
    linkLabel: 'Analyser ma zone',
    billingPlan: 'agent',
    subscribeLabel: 'S’abonner à l’Agent seul',
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
      'Tout l’agent de recensement, sur les codes postaux voisins de votre zone',
      'Tout le système de réservation et sa facturation',
      'Le rapport de secteur d’un côté, les réservations de l’autre, sur le même compte',
      'Un seul abonnement, une seule facture',
    ],
    href: '/nettoyage-automobile',
    linkLabel: 'Voir la démo',
    featured: true,
    billingPlan: 'complet',
    subscribeLabel: 'S’abonner au Pack complet',
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
    subscribeLabel: 'S’abonner au Système seul',
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

/**
 * Une carte par offre — extrait du corps de `PricingTable` le 22/08/2026 pour
 * pouvoir appeler `useCheckout` : les règles des hooks React interdisent de
 * l'appeler à l'intérieur du `.map()` d'un tableau, mais l'autorisent bien
 * dans un composant appelé une fois par offre.
 */
function OfferCard({ offer, region }: { readonly offer: Offer; readonly region: PricingRegion }) {
  // Appelé même pour les offres sans `billingPlan` (agence, sur devis) —
  // sans effet tant que le bouton de paiement n'est pas rendu plus bas,
  // et ça évite d'appeler le hook de façon conditionnelle.
  const checkout = useCheckout(offer.billingPlan ?? 'agent', 'monthly');

  return (
    <article className={offer.featured ? `${styles.offer} ${styles.featured}` : styles.offer}>
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

      {/* `.actions` porte le `margin-block-start: auto` : que la carte ait un
          bouton de paiement ou seulement un lien (offres d'agence, sur
          devis), le bloc reste collé en bas et les cartes restent alignées. */}
      <div className={styles.actions}>
        {/* Bouton plein : mène directement à Stripe. Voir la note en tête de
            `DarkPricing.tsx` (22/08/2026) — même inversion de hiérarchie ici :
            Dorian a signalé que ces boutons ne menaient qu'à des pages
            internes, jamais à un paiement. Les 2 offres d'agence (sur devis)
            n'ont pas d'équivalent : elles gardent seulement le lien. */}
        {offer.billingPlan ? (
          <>
            <Button
              variant={offer.featured ? 'inverse' : 'primary'}
              onClick={checkout.start}
              loading={checkout.state === 'loading'}
              loadingLabel="Ouverture du paiement…"
              className={styles.subscribeButton}
            >
              {offer.subscribeLabel ?? 'S’abonner'}
            </Button>
            {checkout.state === 'error' ? (
              <p className={styles.checkoutError}>
                Le paiement n’a pas pu s’ouvrir. Réessayez, ou{' '}
                <Link href="/contact">écrivez-nous</Link>.
              </p>
            ) : null}
          </>
        ) : null}

        <Link className={styles.link} href={offer.href}>
          {offer.linkLabel}
        </Link>
      </div>
    </article>
  );
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
          <OfferCard key={`${offer.kicker}-${offer.title}`} offer={offer} region={region} />
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
