'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { z } from 'zod';
import { fieldErrors, type FieldErrors } from '@/lib/validation';
import { readAttribution } from '@/lib/attribution';

/**
 * Logique commune aux deux formulaires.
 *
 * Ce qu'elle garantit :
 * — **les saisies sont conservées** en cas d'erreur : l'état vit dans React,
 *   rien n'est réinitialisé, à aucun moment ;
 * — **validation client** avec le schéma partagé, avant tout appel réseau ;
 * — **focus sur le premier champ en erreur**, et résumé d'erreurs annoncé ;
 * — **double envoi impossible** : le bouton est neutralisé pendant l'envoi et
 *   un verrou par référence bloque une seconde soumission concurrente ;
 * — **anti-spam** : champ piège et temps minimal, remplis automatiquement.
 */

export type SubmissionState = 'idle' | 'submitting' | 'success';

type Options<TValues extends Record<string, unknown>> = {
  readonly endpoint: string;
  readonly schema: z.ZodType<unknown, unknown>;
  readonly initialValues: TValues;
  /** Ordre des champs, pour retrouver le premier en erreur. */
  readonly fieldOrder: readonly (keyof TValues & string)[];
  /** Préfixe des `id` dans le DOM, pour cibler le bon champ. */
  readonly idPrefix: string;
  /** Sauvegarde temporaire dans l'onglet courant, jamais au-delà de la session. */
  readonly storageKey?: string;
  /** Demande une confirmation explicite avant de restaurer une saisie inachevée. */
  readonly promptBeforeRestore?: boolean;
};

export function useFormSubmission<TValues extends Record<string, unknown>>({
  endpoint,
  schema,
  initialValues,
  fieldOrder,
  idPrefix,
  storageKey,
  promptBeforeRestore = false,
}: Options<TValues>) {
  const [values, setValues] = useState<TValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState<SubmissionState>('idle');
  const [hasSavedValues, setHasSavedValues] = useState(false);

  const startedAt = useRef<number>(0);
  const locked = useRef(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const storageReady = useRef(false);
  const skipFirstPersist = useRef(true);
  const savedValues = useRef<Partial<TValues> | null>(null);

  // Horodatage posé après l'hydratation : aucun écart entre serveur et client.
  useEffect(() => {
    startedAt.current = Date.now();
    if (storageKey) {
      try {
        const saved = window.sessionStorage.getItem(storageKey);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Invalid persisted form state');
          }

          const sanitized = Object.fromEntries(
            Object.entries(initialValues).flatMap(([key, initialValue]) => {
              const candidate = (parsed as Record<string, unknown>)[key];
              if (Array.isArray(initialValue)) {
                return Array.isArray(candidate) && candidate.every((item) => typeof item === 'string')
                  ? [[key, candidate]]
                  : [];
              }
              return typeof candidate === typeof initialValue ? [[key, candidate]] : [];
            }),
          ) as Partial<TValues>;
          if (promptBeforeRestore) {
            savedValues.current = sanitized;
            window.setTimeout(() => setHasSavedValues(true), 0);
          } else {
            window.setTimeout(() => {
              setValues((current) => ({ ...current, ...sanitized }));
            }, 0);
          }
        }
      } catch {
        try {
          window.sessionStorage.removeItem(storageKey);
        } catch {
          // Le formulaire reste utilisable lorsque le stockage est bloqué.
        }
      }
    }
    storageReady.current = true;
  }, [initialValues, promptBeforeRestore, storageKey]);

  useEffect(() => {
    if (
      !storageKey ||
      !storageReady.current ||
      state === 'success' ||
      (promptBeforeRestore && hasSavedValues)
    ) return;
    if (skipFirstPersist.current) {
      skipFirstPersist.current = false;
      return;
    }
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(values));
    } catch {
      // La persistance est un confort : elle ne doit jamais bloquer le formulaire.
    }
  }, [hasSavedValues, promptBeforeRestore, state, storageKey, values]);

  const clearPersisted = useCallback(() => {
    if (storageKey) {
      try {
        window.sessionStorage.removeItem(storageKey);
      } catch {
        // Rien à nettoyer lorsque le navigateur refuse le stockage de session.
      }
    }
  }, [storageKey]);

  const resumePersisted = useCallback(() => {
    if (savedValues.current) {
      setValues((current) => ({ ...current, ...savedValues.current }));
    }
    savedValues.current = null;
    setHasSavedValues(false);
    skipFirstPersist.current = false;
    startedAt.current = Date.now();
  }, []);

  const discardPersisted = useCallback(() => {
    savedValues.current = null;
    setHasSavedValues(false);
    setValues(initialValues);
    setErrors({});
    setFormError(null);
    clearPersisted();
    skipFirstPersist.current = false;
    startedAt.current = Date.now();
  }, [clearPersisted, initialValues]);

  const setValue = useCallback(
    <K extends keyof TValues & string>(name: K, value: TValues[K]) => {
      setValues((previous) => ({ ...previous, [name]: value }));
      // L'erreur d'un champ disparaît dès que l'on y touche.
      setErrors((previous) => {
        if (!(name in previous)) return previous;
        const next = { ...previous };
        delete next[name];
        return next;
      });
    },
    [],
  );

  const focusFirstError = useCallback(
    (found: FieldErrors) => {
      const first = fieldOrder.find((name) => name in found);
      if (!first) {
        summaryRef.current?.focus();
        return;
      }
      const element = document.getElementById(`${idPrefix}-${first}`);
      if (element) {
        const firstControl = element.querySelector<HTMLElement>('input, select, textarea, button');
        (firstControl ?? element).focus({ preventScroll: false });
      } else {
        summaryRef.current?.focus();
      }
    },
    [fieldOrder, idPrefix],
  );

  const validate = useCallback(
    (validationSchema: z.ZodType<unknown, unknown>) => {
      const parsed = validationSchema.safeParse(values);
      if (parsed.success) {
        setErrors({});
        setFormError(null);
        return true;
      }

      const found = fieldErrors(parsed.error);
      setErrors(found);
      setFormError(null);
      focusFirstError(found);
      return false;
    },
    [focusFirstError, values],
  );

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (locked.current) return;

      const elapsedMs = startedAt.current === 0 ? 0 : Date.now() - startedAt.current;
      const payload = {
        ...values,
        elapsedMs,
        pageUrl: typeof window === 'undefined' ? '' : window.location.href,
        attribution: readAttribution(),
      };

      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        const found = fieldErrors(parsed.error);
        setErrors(found);
        setFormError(null);
        focusFirstError(found);
        return;
      }

      locked.current = true;
      setState('submitting');
      setErrors({});
      setFormError(null);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        });

        const body: unknown = await response.json().catch(() => ({}));
        const result = body as { ok?: boolean; errors?: FieldErrors; message?: string };

        if (response.ok && result.ok) {
          clearPersisted();
          setState('success');
          return;
        }

        if (result.errors) {
          setErrors(result.errors);
          focusFirstError(result.errors);
        }
        setFormError(
          result.message ??
            'Votre message n’a pas pu être transmis. Réessayez dans un instant.',
        );
        setState('idle');
        if (!result.errors) summaryRef.current?.focus();
      } catch {
        setFormError(
          'La connexion a échoué. Votre message n’a pas été transmis. Vérifiez votre connexion et réessayez.',
        );
        setState('idle');
        summaryRef.current?.focus();
      } finally {
        locked.current = false;
      }
    },
    [clearPersisted, endpoint, focusFirstError, schema, values],
  );

  return {
    values,
    setValue,
    errors,
    formError,
    state,
    submit,
    summaryRef,
    validate,
    clearPersisted,
    hasSavedValues,
    resumePersisted,
    discardPersisted,
  };
}
