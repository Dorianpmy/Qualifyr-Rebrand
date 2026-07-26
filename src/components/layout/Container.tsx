import type { ElementType, ReactNode } from 'react';
import styles from './Container.module.css';

type ContainerProps = {
  children: ReactNode;
  /** `default` 1260px · `reading` 720px · `wide` pleine largeur avec gouttières */
  width?: 'default' | 'reading' | 'wide';
  as?: ElementType;
  className?: string | undefined;
};

/** Largeur de contenu maîtrisée et gouttières fluides, zones sûres iOS comprises. */
export function Container({
  children,
  width = 'default',
  as: Tag = 'div',
  className,
}: ContainerProps) {
  const classes = [
    styles.container,
    width === 'reading' ? styles.reading : null,
    width === 'wide' ? styles.wide : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <Tag className={classes}>{children}</Tag>;
}
