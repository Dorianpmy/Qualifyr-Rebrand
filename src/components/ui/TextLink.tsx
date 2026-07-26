import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LinkTarget } from '@/types';
import { Icon } from './Icon';
import styles from './TextLink.module.css';

type TextLinkProps = {
  children: ReactNode;
  /** Route interne du site. */
  href?: LinkTarget;
  /** URL externe ou lien `mailto:` / `tel:`. */
  externalHref?: string;
  tone?: 'accent' | 'quiet' | 'inverse';
  className?: string | undefined;
};

/**
 * Lien de navigation dans un texte courant.
 * Le soulignement est permanent, seule son intensité varie au survol :
 * un lien ne doit jamais être identifiable par la seule couleur.
 */
export function TextLink({
  children,
  href,
  externalHref,
  tone = 'accent',
  className,
}: TextLinkProps) {
  const classes = [
    styles.link,
    tone === 'quiet' ? styles.quiet : null,
    tone === 'inverse' ? styles.inverse : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = <span className={styles.label}>{children}</span>;

  if (externalHref) {
    const isExternal = externalHref.startsWith('http');
    return (
      <a
        href={externalHref}
        className={classes}
        {...(isExternal
          ? { target: '_blank', rel: 'noopener noreferrer' as const }
          : {})}
      >
        {content}
        {isExternal ? <Icon name="arrow-up-right" size={0.85} /> : null}
      </a>
    );
  }

  return (
    <Link href={href ?? '/'} className={classes}>
      {content}
    </Link>
  );
}
