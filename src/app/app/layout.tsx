import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Espace pro — Qualifyr',
  robots: { index: false, follow: false },

  /*
   * Ajouté à l'écran d'accueil, l'espace pro s'ouvre en plein écran, sans la
   * barre d'adresse de Safari. C'est ce qui sépare une page web d'une
   * application : le detailer qui consulte ses demandes entre deux lavages ne
   * doit pas voir d'URL.
   *
   * `black-translucent` fait passer le contenu sous la barre d'état ; les
   * marges de sécurité sont reprises plus bas en CSS avec `env()`.
   */
  appleWebApp: {
    capable: true,
    title: 'Qualifyr',
    statusBarStyle: 'black-translucent',
  },

  /*
   * Manifest propre à l'espace pro (18/09/2026), plutôt que celui hérité de
   * la racine (`/manifest.webmanifest`, `start_url: '/'`) : un pro qui
   * installe l'app depuis son téléphone Android doit atterrir sur son
   * tableau de bord, pas sur le site vitrine. Voir la route
   * `app/manifest.webmanifest/route.ts` pour le détail et le pourquoi.
   */
  manifest: '/app/manifest.webmanifest',
};

/*
 * Le `themeColor` global du site est un beige clair, hérité du site vitrine.
 * Sur l'espace pro, qui est noir, Safari peignait donc une barre d'état claire
 * au-dessus d'une interface sombre — la couture se voyait à chaque scroll.
 * Android fait la même chose avec la barre système.
 *
 * `viewportFit: 'cover'` est indispensable : sans lui, `env(safe-area-inset-*)`
 * vaut zéro et la barre d'onglets passe sous la barre de geste de l'iPhone.
 *
 * Le zoom reste autorisé. Le bloquer règle le problème d'agrandissement au
 * focus d'un champ, mais empêche aussi quelqu'un qui voit mal de lire un
 * montant. Le vrai correctif est ailleurs : tous les champs sont à 16 px.
 */
export const viewport: Viewport = {
  themeColor: '#0e0e0f',
  colorScheme: 'dark',
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return children;
}
