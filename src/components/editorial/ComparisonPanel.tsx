import styles from './ComparisonPanel.module.css';

type ComparisonPanelProps = {
  beforeLabel: string;
  afterLabel: string;
  before: readonly string[];
  after: readonly string[];
  /** Mention obligatoire : ce comparatif décrit une façon de travailler. */
  note: string;
  className?: string | undefined;
};

/**
 * Comparatif avant / après.
 *
 * **Ce n'est pas un résultat garanti**, et le composant impose de le dire :
 * la prop `note` est obligatoire et rend explicite qu'il s'agit d'une manière
 * de travailler, pas d'une promesse de performance. Aucun chiffre, aucun
 * pourcentage, aucune durée n'a sa place dans les deux colonnes.
 *
 * La colonne « avant » est posée sur le sable, la colonne « après » sur le
 * charbon : le contraste de surface porte la comparaison, sans flèche ni
 * pictogramme de progression.
 */
export function ComparisonPanel({
  beforeLabel,
  afterLabel,
  before,
  after,
  note,
  className,
}: ComparisonPanelProps) {
  return (
    <div className={className ? `${styles.panel} ${className}` : styles.panel}>
      <div className={`${styles.column} ${styles.before}`}>
        <p className={styles.columnLabel}>{beforeLabel}</p>
        <ul className={styles.list}>
          {before.map((item) => (
            <li key={item} className={styles.item}>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className={`${styles.column} ${styles.after}`} data-surface="inverse">
        <p className={styles.columnLabel}>{afterLabel}</p>
        <ul className={styles.list}>
          {after.map((item) => (
            <li key={item} className={styles.item}>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className={styles.note}>{note}</p>
    </div>
  );
}
