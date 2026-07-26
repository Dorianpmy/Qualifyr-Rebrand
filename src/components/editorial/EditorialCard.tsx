import type { ReactNode } from 'react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import styles from './EditorialCard.module.css';

type EditorialCardProps = {
  title: string;
  children: ReactNode;
  eyebrow?: string;
  footer?: ReactNode;
  /** Encadré léger. À réserver aux blocs isolés, jamais en grille dense. */
  boxed?: boolean;
  /** Titre agrandi, pour les piliers de premier niveau. */
  size?: 'default' | 'large';
  inverse?: boolean;
  className?: string | undefined;
};

/**
 * Bloc de texte titré, délimité par un filet supérieur.
 *
 * Ce n'est pas une carte au sens habituel : ni ombre, ni fond, ni gros rayon.
 * Trois par rangée au maximum. Au-delà, on retombe dans la grille de vignettes
 * générique que la direction artistique proscrit.
 */
export function EditorialCard({
  title,
  children,
  eyebrow,
  footer,
  boxed = false,
  size = 'default',
  inverse = false,
  className,
}: EditorialCardProps) {
  const classes = [
    styles.card,
    size === 'large' ? styles.large : null,
    boxed ? styles.boxed : null,
    inverse ? styles.inverse : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={classes}>
      {eyebrow ? (
        <Eyebrow bare inverse={inverse}>
          {eyebrow}
        </Eyebrow>
      ) : null}
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.body}>{children}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </article>
  );
}
