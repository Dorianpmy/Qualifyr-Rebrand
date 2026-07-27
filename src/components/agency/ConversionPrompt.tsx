'use client';

import { useEffect, useRef, useState } from 'react';
import { agencyChannels } from '@/content/agency-channels';
import styles from './ConversionPrompt.module.css';

const inactivityDelay = 20_000;

export function ConversionPrompt() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const message = 'Bonjour, je souhaite discuter de mon projet avec Qualifyr.';
  const whatsappUrl = agencyChannels.whatsappNumber
    ? `https://wa.me/${agencyChannels.whatsappNumber}?text=${encodeURIComponent(message)}`
    : null;

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    const openPrompt = () => {
      if (shownRef.current || document.visibilityState !== 'visible') return;
      shownRef.current = true;
      setIsOpen(true);
      dialogRef.current?.showModal();
    };

    const restartTimer = () => {
      if (shownRef.current) return;
      clearTimer();
      timerRef.current = setTimeout(openPrompt, inactivityDelay);
    };

    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, restartTimer, { passive: true }));
    restartTimer();

    const preventContextMenu = (event: MouseEvent) => event.preventDefault();
    document.addEventListener('contextmenu', preventContextMenu);

    return () => {
      clearTimer();
      events.forEach((eventName) => window.removeEventListener(eventName, restartTimer));
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, []);

  const close = () => {
    dialogRef.current?.close();
    setIsOpen(false);
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="conversion-prompt-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={() => setIsOpen(false)}
    >
      <div className={styles.frame}>
        <div className={styles.marker} aria-hidden="true">01</div>
        <p className={styles.eyebrow}>Un point à clarifier&nbsp;?</p>
        <h2 id="conversion-prompt-title">Parlons de ce qui freine votre activité.</h2>
        <p className={styles.copy}>
          Décrivez-nous votre situation. Nous regarderons le parcours le plus simple pour vos clients et votre quotidien.
        </p>
        <div className={styles.actions}>
          {whatsappUrl ? (
            <a className={styles.primary} href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              Discuter sur WhatsApp
            </a>
          ) : null}
          <button className={styles.secondary} type="button" onClick={close} autoFocus={isOpen}>
            Continuer la visite
          </button>
        </div>
      </div>
    </dialog>
  );
}
