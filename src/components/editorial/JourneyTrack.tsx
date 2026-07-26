import styles from './JourneyTrack.module.css';

type Step = {
  readonly number: string;
  readonly label: string;
};

type JourneyTrackProps = {
  steps: readonly Step[];
  className?: string | undefined;
};

/**
 * Frise du parcours vécu par le client final.
 *
 * Mobile : séquence verticale reliée par un trait continu, une étape par ligne,
 * entièrement lisible sans zoom. Bureau : trois colonnes, chaque étape posée
 * sous un filet fin. **Aucun défilement horizontal, à aucun palier** — un
 * carrousel ou une bande scrollable est proscrit par la direction artistique.
 *
 * Rendu en `<ol>` : l'ordre porte du sens.
 */
export function JourneyTrack({ steps, className }: JourneyTrackProps) {
  return (
    <ol className={className ? `${styles.track} ${className}` : styles.track}>
      {steps.map((step) => (
        <li key={step.number} className={styles.step}>
          <span className={styles.marker} aria-hidden="true" />
          <div className={styles.head}>
            <span className={styles.number}>{step.number}</span>
            <span className={styles.label}>{step.label}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
