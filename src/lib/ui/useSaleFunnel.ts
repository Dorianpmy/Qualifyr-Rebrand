'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook du tunnel de vente SaaS.
 *
 * Gère l'état du tunnel (étapes, progression, événements analytics)
 * pour l'OfferConfigurator. Centralise ce qui était dispersé dans le
 * composant afin que le tunnel soit testable et réutilisable.
 */

export type FunnelStep = 0 | 1 | 2 | 3 | 4;
export type FunnelEvent = 'started' | 'completed';

export interface SaleFunnelOptions {
  /** Callback analytics — dans le hook, log Seulement si fourni. */
  onEvent?: (event: FunnelEvent, payload?: Record<string, unknown>) => void;
  /** Affiche ou masque l'intro du tunnel. */
  showIntro?: boolean;
}

export type SaleFunnelState = {
  /** Étape actuelle (0 = intro, 1-4 = tunnel). */
  readonly step: number;
  /** Événement "started" déjà envoyé. */
  readonly started: boolean;
  /** Événement "completed" déjà envoyé. */
  readonly completed: boolean;
  /** Progression 0-100. */
  readonly progress: number;
};

export function useSaleFunnel({
  onEvent,
  showIntro = true,
}: SaleFunnelOptions = {}): SaleFunnelState & {
  setStep: (step: number) => void;
} {
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const startedRef = useRef(started);
  const completedRef = useRef(completed);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    startedRef.current = started;
    completedRef.current = completed;
    onEventRef.current = onEvent;
  }, [started, completed, onEvent]);

  useEffect(() => {
    if (showIntro) {
      setStep(0);
    }
  }, [showIntro]);

  const fireEvent = useCallback(
    (event: FunnelEvent, payload?: Record<string, unknown>) => {
      if (!onEventRef.current) return;
      onEventRef.current(event, payload);
    },
    [],
  );

  const setStepSafe = useCallback(
    (next: number) => {
      const bounded = Math.max(0, Math.min(4, next));
      if (bounded > 0 && !startedRef.current) {
        setStarted(true);
        fireEvent('started', { step: bounded });
      }
      if (bounded === 4 && !completedRef.current) {
        setCompleted(true);
        fireEvent('completed', { step: bounded });
      }
      setStep(bounded);
    },
    [fireEvent],
  );

  const currentProgress = Math.round(((step + 1) / 5) * 100);

  return {
    step,
    started,
    completed,
    progress: currentProgress,
    setStep: setStepSafe,
  };
}

/* Événements du tunnel (liste explicite pour les rapports). */
export const FUNNEL_EVENTS = {
  started: 'started' as const,
  completed: 'completed' as const,
} satisfies Record<FunnelEvent, string>;

/* Valeurs par défaut du tunnel (à réutiliser dans les tests). */
export const DEFAULT_FUNNEL_STATE: SaleFunnelState = {
  step: 0,
  started: false,
  completed: false,
  progress: 20,
};
