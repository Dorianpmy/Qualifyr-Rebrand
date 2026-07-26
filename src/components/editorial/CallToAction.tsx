import type { ReactNode } from 'react';
import { primaryCta } from '@/content/brand';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import styles from './CallToAction.module.css';

type CallToActionProps = {
  title: string;
  eyebrow?: string;
  children?: ReactNode;
  /**
   * Éléments de réassurance. Faits vérifiables uniquement — jamais de délai,
   * de gratuité ni de disponibilité non tenus.
   */
  reassurance?: readonly string[];
  /** Action secondaire, facultative. Une seule action principale par écran. */
  secondaryAction?: ReactNode;
  /**
   * Libellé de l'action principale. À n'utiliser que si la page appelle une
   * formulation plus précise ; la destination reste `/diagnostic`.
   */
  actionLabel?: string;
  /** Sur fond clair au lieu du bloc charbon. */
  light?: boolean;
  className?: string | undefined;
};

/**
 * Bloc de clôture, identique en bas de chaque page.
 *
 * Il porte l'unique appel à l'action du site — « Parler de mon activité »,
 * vers le diagnostic. Aucune urgence artificielle : pas de « places
 * limitées », pas de compte à rebours, pas de promesse de rappel sous 24 h.
 *
 * S'insère dans une `Section surface="inverse"` : c'est la seule section
 * charbon d'une page.
 */
export function CallToAction({
  title,
  eyebrow,
  children,
  reassurance,
  secondaryAction,
  actionLabel,
  light = false,
  className,
}: CallToActionProps) {
  const classes = [styles.cta, light ? styles.light : null, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div>
        {eyebrow ? (
          <Eyebrow inverse={!light} className={styles.eyebrow}>
            {eyebrow}
          </Eyebrow>
        ) : null}
        <h2 className={styles.title}>{title}</h2>
      </div>
      <div className={styles.aside}>
        {children ? <div className={styles.body}>{children}</div> : null}
        <div className={styles.actions}>
          <ButtonLink href={primaryCta.href} variant={light ? 'primary' : 'inverse'} withArrow>
            {actionLabel ?? primaryCta.label}
          </ButtonLink>
          {secondaryAction}
        </div>
        {reassurance && reassurance.length > 0 ? (
          <ul className={styles.reassurance}>
            {reassurance.map((item) => (
              <li key={item} className={styles.reassuranceItem}>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
