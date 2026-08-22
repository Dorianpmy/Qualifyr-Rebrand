'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { primaryNav } from '@/content/navigation';
import { brand } from '@/content/brand';
import { WhatsAppDirectButton } from '@/components/agency/WhatsAppDirectButton';
import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import styles from './MobileNavigation.module.css';

type MobileNavigationProps = {
  pathname: string;
};

/**
 * Menu mobile plein écran.
 *
 * **Panneau rendu via portail dans `document.body` (22/08/2026, cause
 * racine trouvée sur signalement direct : « toujours aucun menu déroulant
 * en mobile »).** Le panneau (`.panel`, `position: fixed; inset: 0`) était
 * jusqu'ici un descendant DOM ordinaire de `<header>`. Or `globals.css`
 * force `header { backdrop-filter: blur(12px) !important }` sur toute page
 * sans section `[data-theme='dark']` (dont `/tarifs`, `/a-propos`,
 * `/contact`...) — et `backdrop-filter` (comme `transform`/`filter`) crée un
 * nouveau bloc de confinement pour ses descendants en `position: fixed` :
 * `inset: 0` se calculait alors par rapport à la boîte du `<header>`
 * (~4rem de haut), pas au viewport. Le panneau se retrouvait donc écrasé
 * dans la hauteur de la barre de navigation elle-même — d'où le bandeau
 * noir vide avec juste le logo et le bouton fermer, sans la liste de liens
 * visible en dessous. Un portail vers `document.body` sort le panneau de
 * l'arbre DOM du `<header>` : plus aucune propriété posée sur un ancêtre
 * (existante ou future) ne peut casser son positionnement plein écran.
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

  // Pas de garde « monté côté client » séparée pour le portail : `isOpen`
  // démarre à `false` et ne passe à `true` que via le clic sur le
  // déclencheur, donc forcément après l'hydratation — `document` existe
  // déjà à ce moment-là, inutile d'ajouter un état et un effet rien que
  // pour ça (et la règle `react-hooks/set-state-in-effect` l'interdit de
  // toute façon pour un `setState` sans autre travail dans l'effet).

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

      {isOpen
        ? createPortal(
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
                <WhatsAppDirectButton onClick={close}>Discuter sur WhatsApp</WhatsAppDirectButton>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
