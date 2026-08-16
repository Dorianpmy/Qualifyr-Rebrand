'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Révélation au défilement — un seul observateur pour toute la page.
 *
 * Principe : le serveur rend le contenu **visible**. Le masquage initial est
 * posé par CSS, à l'intérieur d'une requête `prefers-reduced-motion:
 * no-preference` — donc jamais pour qui a demandé de réduire les animations,
 * et sans le script d'amorçage qui provoquait une erreur de rendu.
 *
 * Conséquences voulues :
 * — sans JavaScript, la page est intégralement lisible ;
 * — si le script échoue, la page est intégralement lisible ;
 * — en `prefers-reduced-motion`, la page est intégralement lisible ;
 * — aucun contenu n'attend une animation pour apparaître.
 *
 * L'effet lui-même est volontairement discret : opacité et 12 px de
 * translation verticale, une seule fois, réservé aux **grandes sections**.
 * Pas d'effet sur chaque carte, pas de décalage en cascade, pas de parallaxe.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    // Le masquage initial est piloté par `prefers-reduced-motion` en CSS.
    // L'observateur s'aligne : si le visiteur a réduit les animations, rien
    // n'est masqué et il n'y a rien à révéler.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal-target]'),
    );
    if (targets.length === 0) return;

    const reveal = (element: HTMLElement) => {
      element.dataset.revealed = 'true';
    };

    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.14 },
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
