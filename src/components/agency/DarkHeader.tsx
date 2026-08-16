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
 */
const saasLink = { href: '/nettoyage-automobile', label: 'Espace SaaS' } as const;

export function DarkHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      data-theme="dark"
      className={`sticky top-0 z-50 w-full transition-colors duration-200 motion-reduce:transition-none ${
        scrolled ? 'border-b border-hairline bg-ink/80 backdrop-blur-md' : ''
      }`}
    >
      <div className="mx-auto flex max-w-page items-center justify-between gap-6 px-5 py-3.5 sm:px-8">
        <Link
          href="/"
          className="text-[0.9375rem] font-semibold tracking-[-0.01em] !text-primary no-underline"
        >
          Qualifyr
        </Link>

        {/* Masquée sous 900 px : cinq libellés français ne tiennent pas, et un
            menu déroulant sur une page d'une seule colonne n'apporte rien —
            le visiteur fait défiler. */}
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
              téléphone, où la place manque et où personne ne se connecte à son
              tableau de bord depuis une page de vente. */}
          <Link
            href="/app"
            className="hidden text-[0.875rem] !text-muted no-underline transition-colors duration-150 hover:!text-primary sm:inline motion-reduce:transition-none"
          >
            Espace pro
          </Link>

          <Link
            href="#agent-title"
            className="cta-solid accent-glow inline-flex min-h-[40px] items-center rounded-full bg-white px-4 text-[0.875rem] font-semibold text-ink no-underline"
          >
            Tester ma ville
          </Link>
        </div>
      </div>
    </header>
  );
}
