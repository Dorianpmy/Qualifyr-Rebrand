import type { ReactNode } from 'react';
import styles from './WarningBanner.module.css';

/**
 * Bandeau d'avertissement — un vrai style, pas une ligne de texte rouge.
 *
 * Les messages qui empêchent un client d'avancer (créneaux indisponibles,
 * adresse hors zone, réservation refusée) vivaient jusqu'ici en simple texte
 * coloré, sans poids visuel : facile à lire en diagonale, facile à manquer.
 * Ce bandeau porte un fond, un contour et une icône — la même différence
 * qu'entre une remarque et une alerte.
 *
 * **L'ambre, pas le sable.** `var(--accent-1)` (le sable de la charte) se lit
 * comme orange sur un écran réel, et cette teinte est réservée aux deux
 * points d'accent de la page. L'ambre du dashboard (`--color badge attente`)
 * est une couleur sémantique différente, déjà utilisée pour « en attente
 * d'action » — elle ne mange pas dans le budget couleur du site vitrine.
 */
function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.icon}
    >
      <path d="M12 3.5 21.5 20h-19Z" />
      <path d="M12 9.3v4.6" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WarningBanner({ children }: { children: ReactNode }) {
  return (
    <p className={styles.warning} role="alert">
      <WarningIcon />
      <span>{children}</span>
    </p>
  );
}
