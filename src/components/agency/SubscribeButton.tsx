'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';

/**
 * Déclenche un vrai paiement Stripe pour l'un des trois abonnements SaaS.
 *
 * **Bouton secondaire, pas remplacement du CTA principal.** Les CTA
 * principaux des cartes de tarifs (« Analyser ma zone », « Tester le tunnel
 * client », « Voir le tableau de bord ») sont des essais gratuits, sans
 * carte bancaire — c'est écrit juste en dessous de chacun. Un prospect qui
 * clique dessus s'attend à essayer, pas à payer : y brancher un paiement
 * direct romprait cette promesse au premier clic. Ce bouton vit à côté,
 * pour le prospect déjà convaincu qui veut s'abonner sans repasser par
 * l'essai.
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
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  async function handleClick() {
    setState('loading');
    trackEvent('subscribe_button_clicked', { ctaId: `${plan}-${cadence}` });
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, cadence }),
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setState('error');
        return;
      }

      // Redirection pleine page, pas `router.push` : la destination est le
      // domaine de Stripe, pas une route interne au site.
      window.location.href = data.url;
    } catch {
      setState('error');
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
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
