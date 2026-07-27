import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * La planche `/design-system` est un outil de développement. Son fichier
 * s'appelle `page.dev.tsx` : l'extension `dev.tsx` n'est déclarée que hors
 * production, donc la route — et surtout sa feuille de style — n'existent
 * tout simplement pas dans le build livré. Auparavant elle renvoyait 404 mais
 * son CSS voyageait dans le bundle partagé de toutes les pages.
 */
const pageExtensions =
  process.env.NODE_ENV === 'production'
    ? ['tsx', 'ts']
    : ['dev.tsx', 'tsx', 'ts'];

const nextConfig: NextConfig = {
  pageExtensions,
  allowedDevOrigins: ['127.0.0.1'],
  turbopack: {
    root: projectRoot,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  // Aucune image distante autorisée : tous les visuels sont versionnés dans le dépôt.
  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },
  typescript: {
    // Le build échoue en cas d'erreur de type. Aucun contournement.
    ignoreBuildErrors: false,
  },
  // Next 16 n'exécute plus ESLint pendant `next build` :
  // le contrôle passe par le script dédié `npm run lint`.

  /**
   * En-têtes de sécurité de base.
   *
   * Volontairement conservateurs : le site ne charge aucune ressource tierce,
   * ne dépose aucun cookie et ne stocke rien. Ces en-têtes ferment les abus
   * les plus courants sans rien casser.
   *
   * **Pas de Content-Security-Policy à ce stade.** Une CSP stricte imposerait
   * un `nonce` sur le script d'amorçage de la révélation et sur les blocs
   * JSON-LD, plus une passe de tests en conditions réelles. À traiter après le
   * premier déploiement d'aperçu, pas à l'aveugle. Voir docs/10.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/diagnostic.html',
        destination: '/diagnostic',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
