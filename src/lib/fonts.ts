import { Inter, Manrope } from 'next/font/google';

/**
 * Typographie du site.
 *
 * **Manrope pour les titres (18/08/2026, demande explicite).** Remplace
 * Instrument Sans. Chargée sans `weight` fixe : Manrope est une police à
 * graisse variable sur Google Fonts (200-800), et le cahier des charges
 * demande un `font-weight: 750` sur le H1 — une valeur qui n'existe dans
 * aucun fichier statique (400/600/700/800 habituels). Ne pas fixer `weight`
 * fait charger l'instance variable complète : le navigateur peut alors
 * interpoler n'importe quelle graisse entre 200 et 800, 750 y compris.
 *
 * **Inter pour le texte courant.** Remplace Manrope à ce poste. Elle était
 * déjà chargée par ailleurs dans le projet (voir l'`@import` Google Fonts en
 * tête de `globals.css`, pour l'ancienne charte claire) — via `next/font`
 * ici, elle sert maintenant la charte sombre aussi, avec les bénéfices
 * habituels de `next/font` (auto-hébergement, pas de requête bloquante vers
 * Google au chargement).
 *
 * **Instrument Sans et Cormorant Garamond ont disparu.** Aucune des deux
 * n'est plus appelée nulle part dans la direction artistique actuelle ;
 * les garder chargées n'aurait été que du poids mort.
 *
 * Deux familles, pas trois. Chaque famille supplémentaire est une requête
 * bloquante de plus avant le premier affichage du texte.
 */

export const displayFont = Manrope({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const bodyFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const fontClassName = `${displayFont.variable} ${bodyFont.variable}`;
