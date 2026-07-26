import { brand } from '@/content/brand';
import { QualifyrMark } from './QualifyrMark';
import styles from './Logo.module.css';

type LogoProps = {
  inverse?: boolean;
  size?: 'default' | 'large';
  /** Marque au-dessus du mot, comme le lockup d'origine. */
  stacked?: boolean;
};

/**
 * Logo Qualifyr — marque + mot.
 *
 * Reprend le logo fourni : le Q, `QUALIFYR` en capitales serif, `AGENCE` en
 * petites capitales espacées. **Le dégradé doré métallique de l'original n'est
 * pas repris** : `AGENTS.md` §5 et `docs/03` interdisent les effets
 * métalliques, les dégradés or et le cliché noir-or. Le dessin est conservé,
 * la matière ne l'est pas. Décision et solutions de rechange :
 * `docs/12-logo-qualifyr.md`.
 *
 * La couleur n'est jamais écrite dans la marque : elle suit `currentColor` et
 * bascule d'elle-même sur fond sombre.
 */
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
    <span className={classes}>
      <QualifyrMark className={styles.mark} />
      <span className={styles.words}>
        <span className={styles.name}>{brand.wordmark}</span>
        <span className={styles.suffix}>{brand.wordmarkSuffix}</span>
      </span>
    </span>
  );
}
