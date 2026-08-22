import styles from './Logo.module.css';

type LogoProps = {
  inverse?: boolean;
  size?: 'default' | 'large';
  /** Marque au-dessus du mot, comme le lockup d'origine. */
  stacked?: boolean;
  /**
   * À poser sur la charte sombre (barre de menu, pied de page).
   *
   * Sans ce drapeau, le lockup s'affiche noir sur noir : `--text-primary`,
   * dont il hérite, ne vaut la valeur claire que sur trois pages précises —
   * voir la note dans `Logo.module.css`.
   */
  onDark?: boolean;
};

/** Nouveau lockup Qualifyr fourni par Dorian, décliné en masque monochrome. */
export function Logo({
  inverse = false,
  size = 'default',
  stacked = false,
  onDark = false,
}: LogoProps) {
  const classes = [
    styles.logo,
    size === 'large' ? styles.large : null,
    stacked ? styles.stacked : null,
    inverse ? styles.inverse : null,
    onDark ? styles.onDark : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} role="img" aria-label="Qualifyr Agence">
      <span className={styles.lockup} aria-hidden="true" />
    </span>
  );
}
