import styles from './Logo.module.css';

type LogoProps = {
  inverse?: boolean;
  size?: 'default' | 'large';
  /** Marque au-dessus du mot, comme le lockup d'origine. */
  stacked?: boolean;
};

/** Nouveau lockup Qualifyr fourni par Dorian, décliné en masque monochrome. */
export function Logo({ inverse = false, size = 'default', stacked = false }: LogoProps) {
  const classes = [
    styles.logo,
    size === 'large' ? styles.large : null,
    stacked ? styles.stacked : null,
    inverse ? styles.inverse : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} role="img" aria-label="Qualifyr Agence">
      <span className={styles.lockup} aria-hidden="true" />
    </span>
  );
}
