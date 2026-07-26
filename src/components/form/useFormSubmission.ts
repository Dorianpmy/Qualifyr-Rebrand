'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { z } from 'zod';
import { fieldErrors, type FieldErrors } from '@/lib/validation';

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
};

export function useFormSubmission<TValues extends Record<string, unknown>>({
  endpoint,
  schema,
  initialValues,
  fieldOrder,
  idPrefix,
}: Options<TValues>) {
  const [values, setValues] = useState<TValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState<SubmissionState>('idle');

  const startedAt = useRef<number>(0);
  const locked = useRef(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Horodatage posé après l'hydratation : aucun écart entre serveur et client.
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

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
        element.focus({ preventScroll: false });
      } else {
        summaryRef.current?.focus();
      }
    },
    [fieldOrder, idPrefix],
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
    [endpoint, focusFirstError, schema, values],
  );

  return { values, setValue, errors, formError, state, submit, summaryRef };
}
