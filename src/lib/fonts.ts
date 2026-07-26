import localFont from 'next/font/local';

/**
 * Polices auto-hébergées, servies depuis le dépôt.
 * Aucune requête vers un domaine tiers : ni Google Fonts, ni CDN.
 *
 * Newsreader — serif éditoriale, variable (200→800), sous-ensemble latin.
 * Manrope    — sans-serif d'interface, variable (200→800), sous-ensemble latin.
 *
 * Les deux sont sous licence SIL Open Font License 1.1
 * (voir src/styles/fonts/*-LICENSE.txt).
 */

export const serif = localFont({
  src: [
    {
      path: '../styles/fonts/newsreader-latin-variable.woff2',
      weight: '200 800',
      style: 'normal',
    },
  ],
  variable: '--font-serif',
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
  adjustFontFallback: 'Times New Roman',
});

export const sans = localFont({
  src: [
    {
      path: '../styles/fonts/manrope-latin-variable.woff2',
      weight: '200 800',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

export const fontClassName = `${serif.variable} ${sans.variable}`;
