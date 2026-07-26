import type { ReactNode } from 'react';
import { FieldError } from './Controls';
import styles from './form.module.css';

type FieldProps = {
  /** Identifiant du contrôle : `htmlFor`, `aria-describedby`, cible du focus. */
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
  optional?: boolean;
  error?: string | undefined;
};

/**
 * Enveloppe d'un champ : libellé associé, aide facultative, message d'erreur.
 *
 * Le libellé est un vrai `<label for>` — jamais un placeholder, qui disparaît
 * dès la saisie et n'est pas restitué de façon fiable.
 * Les champs facultatifs sont marqués explicitement plutôt que d'ajouter un
 * astérisque sur tous les autres.
 * L'erreur est toujours un texte : jamais une couleur seule.
 */
export function Field({ id, label, children, hint, optional = false, error }: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {optional ? <span className={styles.optional}>facultatif</span> : null}
      </label>
      {hint ? (
        <p className={styles.hint} id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {children}
      {error ? <FieldError id={id}>{error}</FieldError> : null}
    </div>
  );
}
