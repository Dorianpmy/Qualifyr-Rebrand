import type { ReactNode } from 'react';
import styles from './Eyebrow.module.css';

type EyebrowProps = {
  children: ReactNode;
  /** Sans le filet de laiton — pour les usages imbriqués. */
  bare?: boolean;
  /** Chiffres alignés, pour les sur-titres numérotés. */
  numbered?: boolean;
  inverse?: boolean;
  className?: string | undefined;
};

/**
 * Sur-titre en petites capitales espacées, précédé d'un filet de laiton.
 * C'est le **seul** emploi de majuscules décoratives autorisé sur le site.
 * Ne porte jamais l'information principale : c'est un repère, pas un titre.
 */
export function Eyebrow({
  children,
  bare = false,
  numbered = false,
  inverse = false,
  className,
}: EyebrowProps) {
  const classes = [
    styles.eyebrow,
    bare ? styles.bare : null,
    numbered ? styles.numbered : null,
    inverse ? styles.inverse : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <p className={classes}>{children}</p>;
}
