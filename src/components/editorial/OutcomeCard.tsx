import type { ReactNode } from 'react';
import styles from './OutcomeCard.module.css';

type OutcomeCardProps = {
  /** Le moyen employé — affiché en petit, en sur-titre. */
  means: string;
  /** Ce que cela change pour l'activité — affiché en grand. */
  result: string;
  children?: ReactNode;
  inverse?: boolean;
  className?: string | undefined;
};

/**
 * Met en regard un moyen et son effet sur l'activité.
 *
 * Règle non négociable : le `result` ne contient **jamais** de chiffre, de
 * pourcentage ni de délai. Ce composant ne sert pas à afficher des statistiques
 * — il n'en existe aucune de vérifiée (AGENTS.md, §6).
 */
export function OutcomeCard({
  means,
  result,
  children,
  inverse = false,
  className,
}: OutcomeCardProps) {
  const classes = [styles.outcome, inverse ? styles.inverse : null, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <p className={styles.means}>{means}</p>
      <p className={styles.result}>{result}</p>
      {children ? <div className={styles.detail}>{children}</div> : null}
    </div>
  );
}
