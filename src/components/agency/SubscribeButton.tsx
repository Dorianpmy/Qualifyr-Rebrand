'use client';

import type { CSSProperties } from 'react';
import { useCheckout } from '@/lib/billing/use-checkout';

/**
 * Déclenche un vrai paiement Stripe pour l'un des trois abonnements SaaS.
 *
 * **Bouton principal des cartes de tarifs depuis le 22/08/2026.** Jusque-là,
 * les CTA principaux des cartes (« Analyser ma zone », « Tester le tunnel
 * client », « Voir le tableau de bord ») étaient des essais gratuits, et ce
 * composant vivait en petit lien secondaire en dessous. Dorian l'a testé et
 * signalé directement : ces boutons ne menaient qu'à des ancres de la même
 * page, jamais à un paiement — voir la note en tête de `DarkPricing.tsx` et
 * `PricingTable.tsx` pour la nouvelle hiérarchie (ce bouton plein, l'essai
 * gratuit en lien discret en dessous).
 *
 * **Pourquoi un composant à part plutôt qu'un `<Link>`.** Un lien classique
 * ne peut pointer que vers une URL connue à l'avance ; l'URL de paiement
 * n'existe qu'après que Stripe a créé la session, à la demande. D'où un
 * clic → appel à `/api/billing/checkout` → redirection vers l'URL renvoyée.
 */

type Plan = 'agent' | 'complet' | 'systeme';
type Cadence = 'monthly' | 'annual';

export function SubscribeButton({
  plan,
  cadence,
  label = 'S’abonner directement',
  className,
  style,
}: {
  readonly plan: Plan;
  readonly cadence: Cadence;
  readonly label?: string;
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}) {
  const { state, start } = useCheckout(plan, cadence);

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={state === 'loading'}
        className={
          className ??
          'text-[0.8125rem] font-medium underline decoration-white/25 underline-offset-4 transition-colors duration-150 hover:decoration-white/60 disabled:opacity-60'
        }
        style={style}
      >
        {state === 'loading' ? 'Ouverture du paiement…' : label}
      </button>
      {state === 'error' ? (
        <p className="mt-1.5 text-[0.75rem] text-faint">
          Le paiement n’a pas pu s’ouvrir. Réessayez, ou{' '}
          <a href="/contact" className="underline">
            écrivez-nous
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}
