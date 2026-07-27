'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { primaryNav } from '@/content/navigation';
import { brand } from '@/content/brand';
import { WhatsAppDiagnosticButton } from '@/components/agency/WhatsAppDiagnostic';
import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import styles from './MobileNavigation.module.css';

type MobileNavigationProps = {
  pathname: string;
};

/**
 * Menu mobile plein écran.
 *
 * Comportement d'accessibilité :
 * — `aria-expanded` et `aria-controls` sur le déclencheur ;
 * — `role="dialog"` + `aria-modal` sur le panneau ;
 * — focus déplacé sur le bouton de fermeture à l'ouverture, rendu au
 *   déclencheur à la fermeture ;
 * — piège de focus au `Tab` et au `Shift+Tab` ;
 * — `Échap` ferme ;
 * — défilement du corps de page bloqué pendant l'ouverture ;
 * — zones sûres iOS respectées via `env(safe-area-inset-*)`.
 */
export function MobileNavigation({ pathname }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(true)}
      >
        <Icon name="menu" size={1.15} />
        Menu
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          id={panelId}
          className={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal"
        >
          <div className={styles.panelHead}>
            <Link href="/" onClick={close} aria-label="Qualifyr Agence, accueil">
              <Logo />
            </Link>
            <button ref={closeRef} type="button" className={styles.close} onClick={close}>
              <Icon name="close" size={1.15} />
              Fermer
            </button>
          </div>

          <nav aria-label="Navigation principale">
            <ul className={styles.list}>
              {primaryNav.map((item, index) => (
                <li key={item.href} className={styles.item}>
                  <Link
                    href={item.href}
                    className={styles.link}
                    onClick={close}
                    {...(pathname === item.href
                      ? { 'aria-current': 'page' as const }
                      : {})}
                  >
                    <span className={styles.index}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.linkLabel}>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.foot}>
            <p className={styles.footNote}>{brand.descriptor}</p>
            <WhatsAppDiagnosticButton onClick={close}>
              Discuter sur WhatsApp
            </WhatsAppDiagnosticButton>
          </div>
        </div>
      ) : null}
    </>
  );
}
