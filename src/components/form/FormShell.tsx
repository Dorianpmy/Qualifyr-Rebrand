'use client';

import type { ReactNode, RefObject } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { formLabels } from '@/content/forms';
import type { FieldErrors } from '@/lib/validation';
import styles from './form.module.css';

/**
 * Résumé d'erreurs, placé en tête de formulaire.
 *
 * Reçoit le focus quand aucun champ précis n'est en cause (erreur réseau,
 * indisponibilité du service). Annoncé par `role="alert"`.
 */
export function ErrorSummary({
  errors,
  formError,
  summaryRef,
  labels,
}: {
  errors: FieldErrors;
  formError: string | null;
  summaryRef: RefObject<HTMLDivElement | null>;
  labels: Readonly<Record<string, string>>;
}) {
  const entries = Object.entries(errors);
  if (entries.length === 0 && !formError) return null;

  return (
    <div className={styles.summary} role="alert" tabIndex={-1} ref={summaryRef}>
      <p className={styles.summaryTitle}>{formError ?? formLabels.errorSummaryTitle}</p>
      {entries.length > 0 ? (
        <>
          <p>{formLabels.errorSummaryIntro}</p>
          <ul className={styles.summaryList}>
            {entries.map(([field, message]) => (
              <li key={field}>
                <span className={styles.summaryField}>{labels[field] ?? field}</span> —{' '}
                {message}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

/**
 * Confirmation affichée après un envoi réussi.
 *
 * Le formulaire est remplacé sur place : **aucune redirection brutale**, la
 * personne reste où elle est et voit ce qui s'est passé. Aucun délai de réponse
 * n'est annoncé, aucun calendrier n'est proposé.
 */
export function SuccessPanel({
  title,
  children,
  summary,
}: {
  title: string;
  children: ReactNode;
  summary?: readonly { readonly label: string; readonly value: string }[];
}) {
  return (
    <div className={styles.success} role="status">
      <p className={styles.successTitle}>{title}</p>
      <p className={styles.successBody}>{children}</p>

      {summary && summary.length > 0 ? (
        <dl className={styles.successSummary}>
          {summary.map((item) => (
            <div key={item.label} className={styles.successRow}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className={styles.successActions}>
        <ButtonLink href="/" variant="secondary">
          Revenir à l’accueil
        </ButtonLink>
        <ButtonLink href="/methode" variant="text">
          Découvrir la méthode
        </ButtonLink>
      </div>
    </div>
  );
}
