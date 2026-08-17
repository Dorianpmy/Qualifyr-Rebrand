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
    remotePatterns: [
      // Photos avant/après des professionnels, servies depuis le Storage
      // Supabase. Sans cette autorisation, `next/image` refuse l'URL et la
      // preuve visuelle — l'argument le plus fort de la page — n'apparaît pas.
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
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
    const transport = {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    };

    return [
      {
        /**
         * Tout le site sauf `/embed`.
         *
         * `X-Frame-Options: DENY` ne se surcharge pas : émis deux fois, il est
         * traité comme un refus par tous les navigateurs. Le tunnel embarqué
         * doit donc être exclu **ici**, à la source, plutôt que corrigé plus
         * loin par une règle qui n'aurait aucun effet.
         */
        source: '/((?!embed/).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          transport,
        ],
      },
      {
        /**
         * Tunnel embarqué sur le site d'un professionnel.
         *
         * `frame-ancestors *` est délibéré : le professionnel colle le script
         * sur son propre domaine, que nous ne connaissons pas à l'avance, et
         * qui change quand il refait son site. Une liste blanche à tenir à jour
         * casserait l'intégration sans prévenir. Le risque résiduel est un
         * tiers qui afficherait le tunnel sans autorisation — il ne verrait
         * qu'une page publique et ne pourrait pas réserver au nom d'autrui,
         * chaque réservation étant liée à l'e-mail saisi.
         *
         * `camera=(self)` reste nécessaire : la prise de photo du véhicule
         * passe par l'appareil photo du téléphone.
         */
        source: '/embed/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(), payment=(self), usb=()',
          },
          transport,
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
      // Repositionnement « laveur auto » plutôt que « detailer » (demande de
      // Dorian) : ces deux slugs ont changé, la redirection évite de perdre
      // le référencement déjà acquis sur les anciennes URLs.
      {
        source: '/blog/trouver-des-clients-en-detailing',
        destination: '/blog/trouver-des-clients-en-lavage-auto',
        permanent: true,
      },
      {
        source: '/blog/grille-tarifaire-detailing-par-vehicule',
        destination: '/blog/grille-tarifaire-lavage-auto-par-vehicule',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
