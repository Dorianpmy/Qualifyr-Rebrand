import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { FloatingWhatsApp } from '@/components/agency/FloatingWhatsApp';
import { AttributionCapture } from '@/components/agency/AttributionCapture';
import { Footer } from '@/components/layout/Footer';
import { SkipLink } from '@/components/layout/SkipLink';
import { RevealObserver } from '@/components/motion/RevealObserver';
import { JsonLd } from '@/components/seo/JsonLd';
import { fontClassName } from '@/lib/fonts';
import { openGraphImage } from '@/lib/metadata';
import { organization, website } from '@/lib/structured-data';
import { brand } from '@/content/brand';
import { homeSeo, site } from '@/content/site';
import '@/styles/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: homeSeo.title,
    template: `%s — ${brand.fullName}`,
  },
  description: homeSeo.description,
  applicationName: brand.fullName,
  authors: [{ name: brand.fullName, url: site.url }],
  creator: brand.fullName,
  publisher: brand.fullName,
  icons: {
    icon: [
      { url: '/icon.svg?v=5', type: 'image/svg+xml', sizes: 'any' },
      { url: '/icons/qualifyr-48.png?v=5', type: 'image/png', sizes: '48x48' },
    ],
    shortcut: '/icon.svg?v=5',
    apple: [{ url: '/icons/apple-touch-icon.png?v=5', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: 'website',
    locale: site.locale,
    siteName: brand.fullName,
    title: homeSeo.title,
    description: homeSeo.description,
    url: `${site.url}/`,
    images: [openGraphImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: homeSeo.title,
    description: homeSeo.description,
    images: [openGraphImage.url],
  },
  robots: site.indexable
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: '#f5f0e7',
  colorScheme: 'light',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang={site.lang}
      className={fontClassName}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      {/*
       * Il n'y a plus de script d'amorçage ici, et c'est volontaire.
       *
       * Un `<script>` de trois lignes posait `data-motion="on"` sur `<html>`
       * avant le premier rendu, pour autoriser les animations de révélation.
       * Écrit en `dangerouslySetInnerHTML` il déclenchait une erreur de rendu
       * client ; passé par `next/script`, une autre. Les deux disaient la même
       * chose : ce script n'a pas de place propre dans l'App Router.
       *
       * Il n'en a pas besoin. Sa seule fonction était de tester
       * `prefers-reduced-motion` — ce que CSS fait nativement, sans script,
       * sans erreur, et avant même le premier octet de JavaScript. La règle
       * vit désormais dans `base.css`.
       */}
      <body>
        <AttributionCapture />
        <JsonLd data={organization()} />
        <JsonLd data={website()} />
        <SkipLink />

        {/*
         * L'habillage de l'ancienne charte — en-tête vert, pied de page clair,
         * bulle WhatsApp — est rendu pour toutes les pages depuis la racine.
         * Les pages passées à la charte sombre portent leur propre en-tête et
         * leur propre pied de page ; sans garde, elles en afficheraient deux.
         *
         * Le masquage se fait en CSS, sur `body:has([data-theme='dark'])` —
         * voir `tailwind.css`. Une condition en JavaScript sur le chemin
         * obligerait ce composant serveur à devenir client, et donc à charger
         * tout l'habillage dans le navigateur pour finir par ne pas l'afficher.
         *
         * Ces marqueurs disparaîtront avec les dernières pages claires.
         */}
        <div data-legacy-chrome="header">
          <Header />
        </div>
        <div data-legacy-chrome="whatsapp">
          <FloatingWhatsApp />
        </div>

        <main id="contenu">{children}</main>

        <div data-legacy-chrome="footer">
          <Footer />
        </div>
        <RevealObserver />
      </body>
    </html>
  );
}
