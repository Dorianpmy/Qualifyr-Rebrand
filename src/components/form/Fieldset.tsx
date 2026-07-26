import type { ReactNode } from 'react';
import styles from './form.module.css';

type FieldsetProps = {
  legend: string;
  number?: string;
  children: ReactNode;
};

/**
 * Groupe de champs. `<fieldset>` + `<legend>` natifs : le contexte du groupe
 * est annoncé avant chaque champ par les lecteurs d'écran, sans ARIA ajouté.
 */
export function Fieldset({ legend, number, children }: FieldsetProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>
        {number ? <span className={styles.legendNumber}>{number}</span> : null}
        <span className={styles.legendTitle}>{legend}</span>
      </legend>
      <div className={styles.fieldsetBody}>{children}</div>
    </fieldset>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
