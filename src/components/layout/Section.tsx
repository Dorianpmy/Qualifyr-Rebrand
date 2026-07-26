import type { ReactNode } from 'react';
import type { Surface } from '@/types';
import styles from './Section.module.css';

type SectionProps = {
  children: ReactNode;
  surface?: Surface;
  spacing?: 'default' | 'tight' | 'flush';
  /** Filet fin en bord supérieur, au lieu d'un changement de fond. */
  ruled?: boolean;
  /** Cible d'ancre, pour les liens internes. */
  id?: string;
  /** Nom accessible, si la section porte un intitulé propre. */
  ariaLabelledBy?: string;
  className?: string | undefined;
};

/**
 * Bande horizontale pleine largeur : porte le fond et le rythme vertical.
 * Ne gère pas la largeur du contenu — c'est le rôle de `Container`, qu'on
 * imbrique à l'intérieur.
 *
 * `surface="inverse"` pose `data-surface="inverse"`, ce qui bascule
 * automatiquement l'anneau de focus et la couleur de sélection.
 */
export function Section({
  children,
  surface = 'page',
  spacing = 'default',
  ruled = false,
  id,
  ariaLabelledBy,
  className,
}: SectionProps) {
  const classes = [
    styles.section,
    styles[surface],
    spacing === 'tight' ? styles.tight : null,
    spacing === 'flush' ? styles.flush : null,
    ruled ? styles.ruled : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      className={classes}
      {...(id ? { id } : {})}
      {...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {})}
      {...(surface === 'inverse' ? { 'data-surface': 'inverse' as const } : {})}
    >
      {children}
    </section>
  );
}
