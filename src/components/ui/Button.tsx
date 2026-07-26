import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LinkTarget } from '@/types';
import { Icon } from './Icon';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'text' | 'inverse';

type SharedProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string | undefined;
  /** Flèche de continuité, réservée aux actions qui font avancer le parcours. */
  withArrow?: boolean;
};

function classesFor(variant: Variant, className?: string) {
  return [styles.base, styles[variant], className].filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ */
/* Lien d'action — navigation                                          */
/* ------------------------------------------------------------------ */

type ButtonLinkProps = SharedProps & {
  href: LinkTarget;
  onClick?: () => void;
};

/**
 * `ButtonLink` navigue, `Button` agit. Cette distinction n'est pas
 * cosmétique : elle conditionne le comportement clavier, le menu contextuel
 * et la restitution par les lecteurs d'écran. Ne jamais l'inverser.
 */
export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className,
  withArrow = false,
  onClick,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={classesFor(variant, className)}
      {...(onClick ? { onClick } : {})}
    >
      <span className={styles.label}>{children}</span>
      {withArrow ? <Icon name="arrow-right" size={0.95} /> : null}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Bouton — action réelle                                              */
/* ------------------------------------------------------------------ */

type ButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    /** Affiche l'indicateur d'attente et neutralise le bouton. */
    loading?: boolean;
    /** Libellé annoncé pendant l'attente. */
    loadingLabel?: string;
  };

export function Button({
  children,
  variant = 'primary',
  className,
  withArrow = false,
  loading = false,
  loadingLabel = 'Envoi en cours',
  disabled = false,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classesFor(variant, className)}
      disabled={disabled || loading}
      data-loading={loading ? 'true' : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      <span className={styles.label}>{loading ? loadingLabel : children}</span>
      {withArrow && !loading ? <Icon name="arrow-right" size={0.95} /> : null}
    </button>
  );
}
