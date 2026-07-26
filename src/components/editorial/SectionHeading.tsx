import type { ReactNode } from 'react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import styles from './SectionHeading.module.css';

type SectionHeadingProps = {
  title: string;
  eyebrow?: string;
  lead?: ReactNode;
  /** Niveau sémantique. `1` est réservé au titre unique de la page. */
  level?: 1 | 2 | 3;
  /** Chapô rejeté en colonne de droite sur grand écran. */
  split?: boolean;
  inverse?: boolean;
  id?: string;
  className?: string | undefined;
};

/**
 * En-tête éditorial : sur-titre, titre, chapô.
 *
 * Composant unique pour les titres de page (`level={1}`) et de section
 * (`level={2}`) — il n'existe pas de second composant de titre, afin que la
 * hiérarchie reste vérifiable d'un seul endroit. Un seul `level={1}` par page.
 */
export function SectionHeading({
  title,
  eyebrow,
  lead,
  level = 2,
  split = false,
  inverse = false,
  id,
  className,
}: SectionHeadingProps) {
  const Tag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
  const levelClass =
    level === 1 ? styles.level1 : level === 2 ? styles.level2 : styles.level3;

  const classes = [
    styles.heading,
    split ? styles.split : null,
    inverse ? styles.inverse : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const aside = lead ? <p className={styles.lead}>{lead}</p> : null;

  return (
    <div className={classes}>
      {eyebrow ? <Eyebrow inverse={inverse}>{eyebrow}</Eyebrow> : null}
      <Tag className={`${styles.title} ${levelClass}`} {...(id ? { id } : {})}>
        {title}
      </Tag>
      {aside ? <div className={styles.aside}>{aside}</div> : null}
    </div>
  );
}
