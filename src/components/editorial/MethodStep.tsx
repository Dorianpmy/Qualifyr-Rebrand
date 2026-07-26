import type { ReactNode } from 'react';
import styles from './MethodStep.module.css';

type MethodStepProps = {
  number: string;
  title: string;
  children: ReactNode;
  inverse?: boolean;
};

/**
 * Une étape du déroulé d'une collaboration : cadrage, conception, mise en
 * place, ajustement.
 *
 * À ne pas confondre avec `JourneyStep`, qui décrit le parcours du **client
 * final**. `MethodStep` décrit la façon dont Qualifyr travaille.
 *
 * Aucune durée n'est annoncée dans le corps du texte tant qu'elle n'est pas un
 * engagement réellement tenu.
 */
export function MethodStep({ number, title, children, inverse = false }: MethodStepProps) {
  return (
    <li className={inverse ? `${styles.step} ${styles.inverse}` : styles.step}>
      <span className={styles.number}>{number}</span>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.body}>{children}</div>
    </li>
  );
}
