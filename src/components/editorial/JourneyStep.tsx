import type { ReactNode } from 'react';
import styles from './JourneyStep.module.css';

type JourneyStepProps = {
  /** Numéro à deux chiffres : `01` à `06`. */
  number: string;
  /** Libellé de l'étape, repris tel quel de `src/content/brand.ts`. */
  label: string;
  children?: ReactNode;
  inverse?: boolean;
};

/**
 * Une étape du parcours Qualifyr.
 *
 * Les six libellés — être trouvé, être compris, être choisi, être réservé plus
 * facilement, obtenir des avis, favoriser les nouvelles réservations — sont du
 * vocabulaire de référence : ils ne se paraphrasent pas. Ils viennent toujours
 * de `journey` dans `src/content/brand.ts`.
 *
 * À utiliser en séquence continue, jamais en grille de vignettes.
 */
export function JourneyStep({ number, label, children, inverse = false }: JourneyStepProps) {
  return (
    <li className={inverse ? `${styles.step} ${styles.inverse}` : styles.step}>
      <span className={styles.number}>{number}</span>
      <h3 className={styles.label}>{label}</h3>
      {children ? <div className={styles.body}>{children}</div> : null}
    </li>
  );
}
