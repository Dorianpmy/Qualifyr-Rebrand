import { NextResponse } from 'next/server';

/**
 * Manifest PWA dédié à l'espace pro (18/09/2026, demande de Dorian : « je
 * veux que l'espace pro soit une application web, avec logo »).
 *
 * Le manifest racine (`src/app/manifest.ts`) sert le site vitrine : son
 * `start_url` pointe vers `/`, sous le nom « Qualifyr Agence ». Un
 * professionnel qui installe l'espace pro depuis son téléphone doit au
 * contraire atterrir directement sur son tableau de bord (`/app`), sous un
 * nom qui identifie l'outil plutôt que le site public — d'où un second
 * manifest, propre à `/app`, plutôt qu'une modification du manifest racine
 * qui casserait l'installation du site vitrine.
 *
 * **Pas le fichier spécial `manifest.ts` de Next.js** (celui-ci ne peut
 * produire qu'un seul `/manifest.webmanifest`, à la racine) : une route
 * classique, comme les `route.ts` déjà utilisés ailleurs dans `src/app/api`,
 * qui répond avec le bon type MIME à l'URL `/app/manifest.webmanifest`.
 *
 * **Logo** : les mêmes icônes que le manifest racine (`qualifyr-192.png`,
 * `qualifyr-512.png`, `icon.svg`) — l'identité visuelle de l'espace pro reste
 * celle de Qualifyr, pas un logo distinct par professionnel.
 *
 * **`scope`/`start_url` sur `/app`** : une fois installé, ouvrir l'icône
 * ramène directement au tableau de bord, jamais au site vitrine.
 */
export function GET() {
  return NextResponse.json(
    {
      name: 'Qualifyr — Espace pro',
      short_name: 'Qualifyr',
      description: 'Tableau de bord des professionnels du nettoyage automobile Qualifyr.',
      start_url: '/app',
      scope: '/app',
      display: 'standalone',
      background_color: '#0e0e0f',
      theme_color: '#0e0e0f',
      lang: 'fr',
      icons: [
        {
          src: '/icon.svg?v=5',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any',
        },
        {
          src: '/icons/qualifyr-192.png?v=5',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/qualifyr-512.png?v=5',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
}
