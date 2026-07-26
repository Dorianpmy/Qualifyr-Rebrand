import type { ReactNode } from 'react';
import { availableChannels } from '@/content/contact';
import { primaryCta } from '@/content/brand';
import { ButtonLink } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';
import styles from './ContactPanel.module.css';

type ContactPanelProps = {
  title: string;
  children?: ReactNode;
  inverse?: boolean;
  className?: string | undefined;
};

/**
 * Bloc de coordonnées.
 *
 * N'affiche que les canaux réellement renseignés dans
 * `src/content/contact.ts`. Tant qu'aucun n'existe, le panneau propose
 * l'échange plutôt que d'inventer une adresse, un téléphone ou des horaires.
 * Ce repli est un choix assumé, pas un état d'attente à combler.
 */
export function ContactPanel({
  title,
  children,
  inverse = false,
  className,
}: ContactPanelProps) {
  const channels = availableChannels();

  const classes = [styles.panel, inverse ? styles.inverse : null, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div>
        <h2 className={styles.title}>{title}</h2>
        {children ? <div className={styles.intro}>{children}</div> : null}
      </div>

      {channels.length > 0 ? (
        <ul className={styles.channels}>
          {channels.map((channel) => (
            <li key={channel.href} className={styles.channel}>
              <span className={styles.channelLabel}>{channel.label}</span>
              <span className={styles.channelValue}>
                <TextLink externalHref={channel.href} tone={inverse ? 'inverse' : 'accent'}>
                  {channel.value}
                </TextLink>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.fallback}>
          <ButtonLink
            href={primaryCta.href}
            variant={inverse ? 'inverse' : 'secondary'}
            withArrow
          >
            {primaryCta.label}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
