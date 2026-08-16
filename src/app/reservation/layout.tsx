import type { Viewport } from 'next';
import type { ReactNode } from 'react';

/*
 * Le tunnel de réservation se remplit presque toujours sur un téléphone : le
 * client tombe sur le lien depuis Instagram, Google ou un QR code collé sur
 * une camionnette. C'est le seul écran du produit où l'ordinateur est
 * l'exception, pas une alternative.
 *
 * Le `themeColor` du site est un beige clair. Sur ce tunnel, qui est noir,
 * Safari peignait donc une bande claire au-dessus de la page, et Android une
 * barre système assortie — la couture se voyait à chaque défilement.
 *
 * `viewportFit: 'cover'` conditionne `env(safe-area-inset-*)` : sans lui, ces
 * variables valent zéro et la barre de prix collée en bas passe sous la barre
 * de geste de l'iPhone, où elle devient inatteignable.
 *
 * Le zoom reste possible. Un client qui vérifie un montant avant de payer doit
 * pouvoir agrandir ; le bon correctif contre l'agrandissement intempestif est
 * la taille des champs, fixée à 16 px dans la feuille du tunnel.
 */
export const viewport: Viewport = {
  themeColor: '#0e0e0f',
  colorScheme: 'dark',
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
};

export default function ReservationLayout({ children }: { children: ReactNode }) {
  return children;
}
