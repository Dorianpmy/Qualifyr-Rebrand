import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import type { LinkTarget } from '@/types';
import type { AnalyticsEventName } from '@/lib/analytics';
import { Icon } from './Icon';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'text' | 'inverse' | 'inverseSecondary';

type SharedProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string | undefined;
  /** Flèche de continuité, réservée aux actions qui font avancer le parcours. */
  withArrow?: boolean;
  ctaId?: string | undefined;
  analyticsEvent?: AnalyticsEventName | undefined;
  analyticsVertical?: string | undefined;
  analyticsDestination?: string | undefined;
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
  ctaId,
  analyticsEvent,
  analyticsVertical,
  analyticsDestination,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={classesFor(variant, className)}
      {...(onClick ? { onClick } : {})}
      data-cta-id={ctaId}
      data-analytics-event={analyticsEvent}
      data-analytics-vertical={analyticsVertical}
      data-analytics-destination={analyticsDestination ?? href}
    >
      <span className={styles.label}>{children}</span>
      {withArrow ? <Icon name="arrow-right" size={0.95} /> : null}
    </Link>
  );
}

type ButtonAnchorProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'> & {
    href: string;
  };

/** Action externe sûre, rendue comme un lien et jamais comme un bouton. */
export function ButtonAnchor({
  href,
  children,
  variant = 'primary',
  className,
  withArrow = false,
  rel = 'noopener noreferrer',
  ctaId,
  analyticsEvent,
  analyticsVertical,
  analyticsDestination,
  ...rest
}: ButtonAnchorProps) {
  return (
    <a
      href={href}
      className={classesFor(variant, className)}
      rel={rel}
      data-cta-id={ctaId}
      data-analytics-event={analyticsEvent}
      data-analytics-vertical={analyticsVertical}
      data-analytics-destination={analyticsDestination ?? href}
      {...rest}
    >
      <span className={styles.label}>{children}</span>
      {withArrow ? <Icon name="arrow-right" size={0.95} /> : null}
    </a>
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
  ctaId,
  analyticsEvent,
  analyticsVertical,
  analyticsDestination,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classesFor(variant, className)}
      disabled={disabled || loading}
      data-loading={loading ? 'true' : undefined}
      aria-busy={loading || undefined}
      data-cta-id={ctaId}
      data-analytics-event={analyticsEvent}
      data-analytics-vertical={analyticsVertical}
      data-analytics-destination={analyticsDestination}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      <span className={styles.label}>{loading ? loadingLabel : children}</span>
      {withArrow && !loading ? <Icon name="arrow-right" size={0.95} /> : null}
    </button>
  );
}
