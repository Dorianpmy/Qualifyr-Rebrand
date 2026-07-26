'use client';

import { useEffect } from 'react';

/**
 * Révélation au défilement — un seul observateur pour toute la page.
 *
 * Principe : le serveur rend le contenu **visible**. Un script d'amorçage
 * placé dans `<head>` pose `data-motion="on"` sur `<html>` avant le premier
 * rendu, uniquement si le visiteur n'a pas demandé de réduire les animations.
 * C'est ce seul attribut qui met les blocs concernés à l'état initial — sans
 * lui, rien n'est masqué, jamais.
 *
 * Conséquences voulues :
 * — sans JavaScript, la page est intégralement lisible ;
 * — si le script échoue, la page est intégralement lisible ;
 * — en `prefers-reduced-motion`, la page est intégralement lisible ;
 * — aucun contenu n'attend une animation pour apparaître.
 *
 * L'effet lui-même est volontairement discret : opacité et 8 px de
 * translation verticale, une seule fois, réservé aux **grandes compositions**.
 * Pas d'effet sur les cartes, pas de décalage en cascade, pas de parallaxe.
 *
 * Filet de sécurité : au bout de 1,5 s, tout est révélé quoi qu'il arrive —
 * un observateur qui ne se déclenche pas ne doit pas laisser une section vide.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.motion !== 'on') return;

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
      { rootMargin: '0px 0px -12% 0px', threshold: 0.1 },
    );

    targets.forEach((target) => observer.observe(target));

    const failsafe = window.setTimeout(() => {
      targets.forEach(reveal);
      observer.disconnect();
    }, 1500);

    return () => {
      window.clearTimeout(failsafe);
      observer.disconnect();
    };
  }, []);

  return null;
}

/**
 * Script d'amorçage, exécuté avant le premier rendu.
 *
 * Il ne fait qu'une chose : signaler que les animations sont autorisées.
 * Le masquage initial dépend entièrement de cet attribut, ce qui évite le
 * clignotement d'un contenu affiché puis caché après hydratation.
 */
export const revealBootstrap =
  "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.motion='on'}catch(e){}";
