import type { MetadataRoute } from 'next';
import { homeSeo } from '@/content/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Qualifyr Agence',
    short_name: 'Qualifyr',
    description: homeSeo.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f0e7',
    theme_color: '#f5f0e7',
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
  };
}
