'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';

/**
 * Logique partagée d'ouverture d'un paiement Stripe pour un abonnement
 * Qualifyr — extraite le 22/08/2026 pour être réutilisée par `SubscribeButton`
 * (thème sombre, `DarkPricing.tsx`) et par le bouton de paiement de
 * `PricingTable.tsx` (thème clair « agence », `/tarifs`), qui avaient jusque-là
 * chacun leur propre copie de cet appel.
 */

export type BillingPlan = 'agent' | 'complet' | 'systeme';
export type BillingCadence = 'monthly' | 'annual';
export type CheckoutState = 'idle' | 'loading' | 'error';

export function useCheckout(plan: BillingPlan, cadence: BillingCadence) {
  const [state, setState] = useState<CheckoutState>('idle');

  async function start() {
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

  return { state, start };
}
