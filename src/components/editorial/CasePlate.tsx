import Image from 'next/image';
import type { CaseImage } from '@/content/sw-car-cleaning';
import styles from './CasePlate.module.css';

type CasePlateProps = {
  client: string;
  meta: string;
  /** Logo réel du client. `null` → composition typographique. */
  logo?: CaseImage | null;
  tone?: 'sand' | 'ink';
  size?: 'default' | 'large';
  /** Visuel principal de la page : chargement prioritaire. */
  priority?: boolean;
  className?: string | undefined;
};

/**
 * Panneau d'identification d'un projet.
 *
 * Deux états, un seul composant :
 * — **avec logo réel** : l'image est affichée, dimensions déclarées, formats
 *   modernes gérés par `next/image` ;
 * — **sans logo** : composition typographique — secteur, filet de laiton, nom
 *   du client en grande serif.
 *
 * Le second état n'est pas un placeholder d'attente : c'est une mise en page
 * finie, qui tient seule et ne se signale jamais comme provisoire. Aucun texte
 * du type « image à venir » n'est affiché au visiteur (AGENTS.md, §6).
 *
 * Pour passer au logo réel : renseigner `logo` dans
 * `src/content/sw-car-cleaning.ts`. Rien d'autre à modifier.
 */
export function CasePlate({
  client,
  meta,
  logo = null,
  tone = 'sand',
  size = 'default',
  priority = false,
  className,
}: CasePlateProps) {
  const classes = [
    styles.plate,
    styles[tone],
    size === 'large' ? styles.large : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <span className={styles.meta}>{meta}</span>
      <span className={styles.rule} aria-hidden="true" />
      {logo ? (
        <Image
          src={logo.src}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          priority={priority}
          className={styles.logo}
          sizes="(min-width: 62rem) 18rem, 60vw"
        />
      ) : (
        <span className={styles.name}>{client}</span>
      )}
    </div>
  );
}
