'use client';

import { useEffect, useRef } from 'react';
import { agencyChannels } from '@/content/agency-channels';
import { ButtonAnchor } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { bookingPopoverId } from './BookingButton';
import styles from './BookingDialog.module.css';

export function BookingDialog() {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dialogRef.current?.matches(':popover-open')) {
        dialogRef.current.hidePopover();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  if (!agencyChannels.bookingUrl) return null;

  return (
    <div ref={dialogRef} id={bookingPopoverId} className={styles.dialog} popover="auto">
      <div className={styles.shell}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Échange Qualifyr</p>
            <h2>Choisissez votre créneau.</h2>
          </div>
          <button
            className={styles.close}
            type="button"
            aria-label="Fermer le calendrier"
            popoverTarget={bookingPopoverId}
            popoverTargetAction="hide"
          >
            <Icon name="close" size={1.1} />
            <span className="visually-hidden">Fermer</span>
          </button>
        </div>

        <div className={styles.frameWrap}>
          <iframe
            className={styles.frame}
            src={agencyChannels.bookingUrl}
            title="Calendrier de réservation Qualifyr"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

        <div className={styles.footer}>
          <p>Si le calendrier ne s’affiche pas, ouvrez-le directement dans Google Calendar.</p>
          <ButtonAnchor href={agencyChannels.bookingUrl} target="_blank" variant="secondary">
            Ouvrir le calendrier
          </ButtonAnchor>
        </div>
      </div>
    </div>
  );
}
