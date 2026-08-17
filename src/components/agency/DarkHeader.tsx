'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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
 */

const links = [
  { href: '#how-title', label: 'Comment ça marche' },
  { href: '#agent-title', label: 'L’agent' },
  { href: '#before-after-title', label: 'Ce qui change' },
] as const;

/*
 * Lien vers page, pas vers ancre : `/nettoyage-automobile` est le tunnel de
 * vente complet du SaaS de réservation (problème, parcours, démo, tarifs,
 * FAQ), pas une section de la page d'accueil. Séparé du tableau `links`
 * ci-dessus parce qu'il se rend avec `next/link`, pas un `<a>` d'ancre.
 *
 * Le libellé a changé deux fois. « Espace SaaS » d'abord : le visiteur qui
 * lit le menu est un laveur, pas un acheteur de logiciel B2B — « SaaS » ne
 * veut rien dire pour lui. Puis « Réservation en ligne », plus parlant mais
 * qui se lisait comme une page du site vitrine plutôt que comme l'entrée
 * vers le produit. « App Qualifyr » tranche : c'est un nom propre, il ne
 * décrit rien qu'il faille deviner, et il annonce clairement qu'on quitte le
 * site vitrine pour l'outil.
 */
const saasLink = { href: '/nettoyage-automobile', label: 'App Qualifyr' } as const;

const proLink = { href: '/app', label: 'Espace pro' } as const;

export function DarkHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  /*
   * Le bouton hamburger a disparu en production sans qu'on en trouve la
   * cause exacte depuis cet environnement (pas d'accès à un navigateur
   * réel pour inspecter) : `className="lg:hidden"` plus un `style` en
   * ligne forçant `display: flex` aurait dû suffire, et n'a pas suffi. La
   * bascule desktop/mobile est donc recalculée en JavaScript, comme
   * `scrolled` juste au-dessus — la même méthode, déjà fiable ici — plutôt
   * que confiée à une classe Tailwind dont on ne sait plus dire pourquoi
   * elle a cessé de s'appliquer.
   */
  const [isDesktop, setIsDesktop] = useState(false);
  /*
   * Le panneau n'avait aucune transition : il apparaissait et disparaissait
   * d'un coup, ce qui se lit comme un bug plutôt qu'une ouverture (« la barre
   * de menu est invisible »). Il descend maintenant depuis le haut de
   * l'écran — sauf préférence système de mouvement réduit, vérifiée ici
   * plutôt que dans une media query CSS pour rester dans la même logique
   * défensive que `isDesktop` juste au-dessus : une valeur JS certaine plutôt
   * qu'une classe dont on ne sait plus dire si elle s'applique.
   */
  const [reduceMotion, setReduceMotion] = useState(false);

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
  // défilement du fond pendant qu'il est ouvert — au clic sur un lien
  // d'ancre, se fermer aussi remet le défilement en place.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      data-theme="dark"
      className={`sticky top-0 z-50 w-full transition-colors duration-200 motion-reduce:transition-none ${
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

        {/* Masquée sous 900 px : cinq libellés français côte à côte ne
            tiennent pas. Reprise en dessous dans un panneau plein écran
            plutôt que purement supprimée — un visiteur qui arrive sur une
            page sans autre repère (ex. une 404) doit pouvoir naviguer
            ailleurs sans revenir en arrière dans son navigateur. */}
        <nav aria-label="Sections de la page" className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[0.875rem] !text-muted no-underline transition-colors duration-150 hover:!text-primary motion-reduce:transition-none"
            >
              {link.label}
            </a>
          ))}
          <Link
            href={saasLink.href}
            className="text-[0.875rem] !text-muted no-underline transition-colors duration-150 hover:!text-primary motion-reduce:transition-none"
          >
            {saasLink.label}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Entrée de l'espace pro. Discrète et à gauche du bouton principal :
              elle ne s'adresse qu'aux clients déjà équipés, qui la cherchent,
              alors que le bouton blanc s'adresse aux visiteurs. Masquée sur
              téléphone dans la barre elle-même — elle vit dans le panneau du
              menu à la place, pas disparue. */}
          <Link
            href={proLink.href}
            className="hidden text-[0.875rem] !text-muted no-underline transition-colors duration-150 hover:!text-primary sm:inline motion-reduce:transition-none"
          >
            {proLink.label}
          </Link>

          <Link
            href="#agent-title"
            className="hidden cta-solid accent-glow min-h-[40px] items-center rounded-full bg-white px-4 text-[0.875rem] font-semibold text-ink no-underline lg:inline-flex"
            onClick={closeMenu}
          >
            Tester ma ville
          </Link>

          {/* Bouton hamburger : seul élément de navigation visible sous
              900 px, en dehors du lien « Qualifyr » vers l'accueil. */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            style={{
              display: isDesktop ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#f5f4f2',
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Panneau mobile plein écran. Style en ligne pour les propriétés
          critiques (position, visibilité) : les classes Tailwind
          `position`/`inset` ont déjà silencieusement échoué ailleurs dans ce
          projet à cause des `!important` de la charte historique — voir
          `BeforeAfterSection.tsx`.

          Toujours monté sur mobile (pas de `menuOpen &&` conditionnant le
          rendu) : une transition CSS a besoin que l'élément existe déjà dans
          le DOM au moment où la propriété change, sinon rien ne s'anime, le
          panneau apparaît d'un bloc — précisément le symptôme rapporté.
          L'ouverture/fermeture passe donc par `transform`/`opacity`, et
          `pointerEvents` empêche d'interagir avec un panneau fermé qui reste
          présent mais hors écran. */}
      {!isDesktop ? (
        <div
          id="mobile-nav-panel"
          aria-hidden={!menuOpen}
          style={{
            position: 'fixed',
            top: '4.1rem',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 49,
            overflowY: 'auto',
            background: '#0e0e0f',
            transform: menuOpen ? 'translateY(0)' : 'translateY(-100%)',
            opacity: menuOpen ? 1 : 0,
            pointerEvents: menuOpen ? 'auto' : 'none',
            transition: reduceMotion
              ? 'none'
              : 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease',
          }}
        >
          <nav
            aria-label="Menu"
            style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem 1.25rem 2.5rem' }}
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="text-[1.0625rem] font-medium !text-primary no-underline"
                style={{ padding: '0.9rem 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                {link.label}
              </a>
            ))}
            <Link
              href={saasLink.href}
              onClick={closeMenu}
              className="text-[1.0625rem] font-medium !text-primary no-underline"
              style={{ padding: '0.9rem 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              {saasLink.label}
            </Link>
            <Link
              href={proLink.href}
              onClick={closeMenu}
              className="text-[1.0625rem] font-medium !text-primary no-underline"
              style={{ padding: '0.9rem 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              {proLink.label}
            </Link>

            <Link
              href="#agent-title"
              onClick={closeMenu}
              className="cta-solid accent-glow inline-flex items-center justify-center rounded-full bg-white text-[0.9375rem] font-semibold text-ink no-underline"
              style={{ marginTop: '1.5rem', minHeight: '48px' }}
            >
              Tester ma ville
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
