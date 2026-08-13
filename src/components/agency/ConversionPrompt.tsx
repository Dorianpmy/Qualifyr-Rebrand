'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { agencyChannels } from '@/content/agency-channels';
import { buildDirectWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import styles from './ConversionPrompt.module.css';

const inactivityDelay = 60_000;

function isSaaSPath(pathname: string) {
  return (
    pathname.startsWith('/app') ||
    pathname.startsWith('/reservation') ||
    pathname === '/diagnostic'
  );
}

export function ConversionPrompt() {
  const pathname = usePathname();
  const blocked = isSaaSPath(pathname);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const whatsappUrl = buildWhatsAppUrl(
    agencyChannels.whatsappNumber,
    buildDirectWhatsAppMessage(),
  );

  useEffect(() => {
    if (blocked) return;
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

    return () => {
      clearTimer();
      events.forEach((eventName) => window.removeEventListener(eventName, restartTimer));
    };
  }, [blocked]);

  const close = () => {
    dialogRef.current?.close();
    setIsOpen(false);
  };

  if (blocked) return null;

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
            <a className={styles.primary} href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-analytics-event="whatsapp_direct_opened" data-analytics-cta-id="inactivity_prompt_whatsapp" data-analytics-destination="whatsapp">
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
