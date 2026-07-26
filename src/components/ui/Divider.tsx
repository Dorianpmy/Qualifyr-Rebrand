import styles from './Divider.module.css';

type DividerProps = {
  tone?: 'hairline' | 'accent' | 'inverse';
  /** Filet court de 64px, utilisé comme ponctuation sous un titre. */
  short?: boolean;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  className?: string | undefined;
};

/**
 * Filet horizontal. C'est l'outil de structure principal du site :
 * les sections se séparent par des lignes et du vide, jamais par des ombres
 * ni par des cartes empilées.
 *
 * `accent` (laiton) est limité à une occurrence par écran.
 */
export function Divider({
  tone = 'hairline',
  short = false,
  spacing = 'none',
  className,
}: DividerProps) {
  const spacingClass =
    spacing === 'sm'
      ? styles.spacedSm
      : spacing === 'md'
        ? styles.spacedMd
        : spacing === 'lg'
          ? styles.spacedLg
          : null;

  const classes = [
    styles.divider,
    tone === 'accent' ? styles.accent : null,
    tone === 'inverse' ? styles.inverse : null,
    short ? styles.short : null,
    spacingClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <hr className={classes} />;
}
