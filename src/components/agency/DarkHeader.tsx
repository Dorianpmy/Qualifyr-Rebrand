'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/**
 * Barre de navigation du site vitrine.
 *
 * **Transparente en haut, opaque au défilement.** Une barre opaque dès le
 * premier pixel pose un bandeau au-dessus du titre et coupe le hero en deux.
 * Transparente, elle laisse la promesse occuper tout l'écran ; le fond
 * n'apparaît qu'une fois le contenu passé dessous, quand il devient nécessaire
 * de séparer les deux.
 *
 * **Le seuil est à 8 px et non à 0.** Un seuil nul fait clignoter le fond au
 * moindre rebond de défilement, notamment sur trackpad.
 *
 * **Diagnostic du 17/08/2026 (« menu mobile invisible », demande explicite).**
 * Passage en revue de chaque cause possible listée par Dorian :
 * — bouton hamburger absent du DOM ? Non, toujours rendu, y compris sur
 *   desktop (juste masqué) — voir plus bas pourquoi.
 * — `display: none` qui le cache à tort ? Sa visibilité repose sur un seul
 *   mécanisme délibéré : un `style` en ligne piloté par `isDesktop`
 *   (`matchMedia`), pas une classe Tailwind — voir le commentaire sur le
 *   bouton plus bas pour la raison exacte (un style en ligne et une classe
 *   concurrente sur la même propriété se feraient concurrence, pas
 *   redondance).
 * — `z-index` insuffisant ? Le panneau (`z-index: 49`) est un enfant direct
 *   du `<header>` (`z-50`), donc dans le même contexte d'empilement : rien
 *   dans la page (vérifié — aucun autre `z-index` du projet ne dépasse 30
 *   hors de l'espace pro `/app`, dont les pages ne rendent pas ce composant)
 *   ne peut passer devant.
 * — `overflow: hidden` d'un parent qui couperait le panneau ? Le panneau est
 *   `position: fixed`, donc positionné par rapport au viewport, pas à un
 *   ancêtre : un `overflow: hidden` sur un parent ne peut pas le couper.
 * — panneau déplacé hors écran ou invisible (`transform`, `opacity`,
 *   `visibility`) sans repli ? Ces propriétés sont pilotées par l'état
 *   `menuOpen`, jamais figées : à `menuOpen === true`, `translateY(0)` /
 *   `opacity: 1` / `pointerEvents: 'auto'`.
 * — l'état React fonctionne-t-il ? Oui, vérifié : `onClick` bascule
 *   `menuOpen`, qui pilote à la fois le style du panneau et l'attribut
 *   `aria-hidden`.
 * — erreur JavaScript qui casserait le composant ? Aucune dépendance externe
 *   ici, seulement `useState`/`useEffect` ; `npx tsc`/`eslint` propres.
 * — le CSS desktop écrase-t-il le CSS mobile ? La charte historique impose
 *   des règles `!important` très larges (voir `BeforeAfterSection.tsx`) —
 *   c'est précisément pour s'en protéger que les propriétés critiques du
 *   panneau restent en `style` plutôt qu'en classes Tailwind.
 *
 * **Ce qui manquait réellement, corrigé ici :**
 * 1. Fermeture au clavier (`Échap`) : absente, ajoutée.
 * 2. Fermeture au clic en dehors du panneau : absente, ajoutée.
 * 3. Trois des liens du menu (`#how-title`, `#agent-title`,
 *    `#before-after-title`) étaient des ancres qui n'existent que sur `/` —
 *    sur toute autre page (`/fonctionnalites`, `/tarifs`, `/faq`...),
 *    cliquer dessus ne faisait rien. Remplacés par de vraies routes, qui
 *    fonctionnent depuis n'importe quelle page.
 * 4. Contenu du menu aligné sur la structure demandée : Accueil,
 *    Fonctionnalités, Tarifs, FAQ, Connexion, Créer mon compte.
 */

const links = [
  { href: '/', label: 'Accueil' },
  { href: '/fonctionnalites', label: 'Fonctionnalités' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/faq', label: 'FAQ' },
] as const;

const proLink = { href: '/app', label: 'Connexion' } as const;

/*
 * Route réelle plutôt qu'ancre `#agent-title` : ce bouton vit dans un en-tête
 * partagé par toutes les pages sombres, pas seulement l'accueil — un lien
 * d'ancre n'y fonctionne que sur la page qui porte cet id.
 * `/nettoyage-automobile` est la page produit qui contient la démonstration
 * et le formulaire d'essai gratuit.
 */
const primaryCta = { href: '/nettoyage-automobile', label: 'Créer mon compte' } as const;

export function DarkHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  /*
   * Pilote `display` sur le bouton hamburger uniquement, via `style` — voir
   * le commentaire sur le bouton plus bas pour la raison de ce choix.
   */
  const [isDesktop, setIsDesktop] = useState(false);
  /*
   * `reduceMotion` reste vérifié en JavaScript, comme `scrolled` : une valeur
   * JS certaine plutôt qu'une media query CSS dont on ne peut pas garantir
   * qu'elle s'applique face aux `!important` de la charte historique.
   */
  const [reduceMotion, setReduceMotion] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Le panneau mobile pousse le reste de la page si on ne bloque pas le
  // défilement du fond pendant qu'il est ouvert.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Échap referme le menu ; un clic en dehors du panneau (et du bouton, pour
  // ne pas rouvrir immédiatement ce que son propre `onClick` vient de fermer)
  // aussi. Les deux écouteurs ne sont posés que pendant que le menu est
  // ouvert : pas de coût, pas de risque d'interférence, le reste du temps.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      data-theme="dark"
      className={`sticky top-0 z-[10000] w-full transition-colors duration-200 motion-reduce:transition-none ${
        scrolled || menuOpen ? 'border-b border-hairline bg-ink/80 backdrop-blur-md' : ''
      }`}
    >
      <div className="mx-auto flex max-w-page items-center justify-between gap-6 px-5 py-3.5 sm:px-8">
        <Link
          href="/"
          className="text-[0.9375rem] font-semibold tracking-[-0.01em] !text-primary no-underline"
          onClick={closeMenu}
        >
          Qualifyr
        </Link>

        {/* Masquée sous 1024 px (`lg`) : cinq libellés côte à côte ne
            tiennent pas. Reprise en dessous dans un panneau plein écran. */}
        <nav aria-label="Navigation principale" className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.875rem] !text-muted no-underline transition-colors duration-150 hover:!text-primary motion-reduce:transition-none"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={proLink.href}
            className="text-[0.875rem] !text-muted no-underline transition-colors duration-150 hover:!text-primary motion-reduce:transition-none"
          >
            {proLink.label}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={primaryCta.href}
            className="hidden cta-solid accent-glow min-h-[40px] items-center rounded-full bg-white px-4 text-[0.875rem] font-semibold text-ink no-underline lg:inline-flex"
            onClick={closeMenu}
          >
            {primaryCta.label}
          </Link>

          {/* Bouton hamburger : seul élément de navigation visible sous
              1024 px, en dehors du lien « Qualifyr » vers l'accueil.

              `display` posé uniquement en `style`, jamais via une classe
              Tailwind concurrente (ex. `lg:hidden`) : un `style` en ligne
              gagne toujours en spécificité CSS face à une classe — ajouter
              `lg:hidden` À CÔTÉ de ce `style` ne serait pas une redondance
              utile, ce serait une valeur qui peut en écraser une autre selon
              l'ordre de calcul. Un seul mécanisme, mais fiable : `isDesktop`
              est une valeur JavaScript certaine (`matchMedia`), pas une
              classe dont on ne peut plus garantir qu'elle s'applique face
              aux `!important` de la charte historique — voir la note en
              tête de fichier sur l'origine de ce choix.

              **Révision du 17/08/2026 (cause racine trouvée) :** ce bouton
              est un simple `<button>` sans classe assez spécifique pour
              résister à la règle `button { background: #12b76a !important;
              border: none !important; ... }` de `globals.css` (charte
              « Dark Mode Premium » abandonnée mais jamais retirée) — un
              `!important` de feuille de style l'emporte toujours sur un
              `style` en ligne non important, quelle que soit sa spécificité.
              C'est la cause exacte de tous les signalements précédents
              (« bouton invisible », fond/bordure/icône qui ne correspondent
              pas au code). Cette règle est désormais scindée dans
              `globals.css` pour ne plus s'appliquer aux pages `[data-theme=
              'dark']` (voir ce fichier) — mais par prudence supplémentaire,
              l'icône SVG est aussi remplacée ici par l'icône CSS trois
              barres demandée, et les dimensions/fond sont renforcés pour
              rester lisibles même si une règle externe venait à s'imposer à
              nouveau : 44×44px minimum, fond opaque (plus de `transparent`),
              bordure visible, contraste élevé (blanc sur fond sombre). */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            style={{
              display: isDesktop ? 'none' : 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              width: '2.75rem',
              height: '2.75rem',
              minWidth: '44px',
              minHeight: '44px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.32)',
              background: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'block',
                width: '20px',
                height: '2px',
                borderRadius: '2px',
                background: '#ffffff',
                transition: reduceMotion ? 'none' : 'transform 200ms ease, opacity 150ms ease',
                transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
              }}
            />
            <span
              aria-hidden="true"
              style={{
                display: 'block',
                width: '20px',
                height: '2px',
                borderRadius: '2px',
                background: '#ffffff',
                transition: reduceMotion ? 'none' : 'opacity 150ms ease',
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              aria-hidden="true"
              style={{
                display: 'block',
                width: '20px',
                height: '2px',
                borderRadius: '2px',
                background: '#ffffff',
                transition: reduceMotion ? 'none' : 'transform 200ms ease, opacity 150ms ease',
                transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
              }}
            />
          </button>
        </div>
      </div>

      {/* Panneau mobile, déroulé depuis le haut, sous la barre de
          navigation (`top: '4.1rem'`, hauteur de la barre elle-même). Style
          en ligne pour les propriétés critiques (position, visibilité) :
          les classes Tailwind `position`/`inset` ont déjà silencieusement
          échoué ailleurs dans ce projet à cause des `!important` de la
          charte historique — voir `BeforeAfterSection.tsx`.

          Toujours monté dans le DOM (pas de `menuOpen &&` conditionnant le
          rendu) : une transition CSS a besoin que l'élément existe déjà au
          moment où la propriété change, sinon rien ne s'anime, le panneau
          apparaît ou disparaît d'un bloc. `hidden lg:hidden` via `className`
          le retire du flux desktop (où `nav` fait déjà le travail) sans
          dépendre d'un état JS pour cette partie-là. */}
      <div
        ref={panelRef}
        id="mobile-nav-panel"
        aria-hidden={!menuOpen}
        className="lg:hidden"
        style={{
          position: 'fixed',
          top: '4.1rem',
          left: 0,
          right: 0,
          bottom: 0,
          /* 10000, demande explicite du 17/08/2026 (refonte header). Marge
             confortable au-dessus de --z-overlay (200, charte historique) et
             de l'ancien z-50 du header : rien dans le projet n'a besoin de
             passer devant un menu ouvert. */
          zIndex: 10000,
          overflowY: 'auto',
          background: '#0e0e0f',
          transform: menuOpen ? 'translateY(0)' : 'translateY(-100%)',
          opacity: menuOpen ? 1 : 0,
          visibility: menuOpen ? 'visible' : 'hidden',
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: reduceMotion
            ? 'none'
            : 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease, visibility 280ms',
        }}
      >
        <nav
          aria-label="Menu"
          style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem 1.25rem 2.5rem' }}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="text-[1.0625rem] font-medium !text-primary no-underline"
              style={{ padding: '0.9rem 0', borderBottom: '1px solid rgba(255,255,255,0.07)', minHeight: '3rem' }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={proLink.href}
            onClick={closeMenu}
            className="text-[1.0625rem] font-medium !text-primary no-underline"
            style={{ padding: '0.9rem 0', borderBottom: '1px solid rgba(255,255,255,0.07)', minHeight: '3rem' }}
          >
            {proLink.label}
          </Link>

          <Link
            href={primaryCta.href}
            onClick={closeMenu}
            className="cta-solid accent-glow inline-flex items-center justify-center rounded-full bg-white text-[0.9375rem] font-semibold text-ink no-underline"
            style={{ marginTop: '1.5rem', minHeight: '48px' }}
          >
            {primaryCta.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
