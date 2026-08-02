import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { FloatingWhatsApp } from '@/components/agency/FloatingWhatsApp';
import { AttributionCapture } from '@/components/agency/AttributionCapture';
import { ConversionPrompt } from '@/components/agency/ConversionPrompt';
import { Footer } from '@/components/layout/Footer';
import { SkipLink } from '@/components/layout/SkipLink';
import { RevealObserver, revealBootstrap } from '@/components/motion/RevealObserver';
import { JsonLd } from '@/components/seo/JsonLd';
import { fontClassName } from '@/lib/fonts';
import { openGraphImage } from '@/lib/metadata';
import { organization, website } from '@/lib/structured-data';
import { brand } from '@/content/brand';
import { homeSeo, site } from '@/content/site';
import '@/styles/globals.css';

export const metadata: Metadata = {
  // Base de toutes les URL relatives : canonical, Open Graph, images.
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
      { url: '/icon.svg?v=4', type: 'image/svg+xml', sizes: 'any' },
      { url: '/icons/qualifyr-48.png?v=4', type: 'image/png', sizes: '48x48' },
    ],
    shortcut: '/icon.svg?v=4',
    apple: [{ url: '/icons/apple-touch-icon.png?v=4', sizes: '180x180', type: 'image/png' }],
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
  // Seule valeur de couleur hors tokens.css : les métadonnées du navigateur
  // n'acceptent pas de variable CSS. À garder synchronisée avec --color-ivory.
  themeColor: '#f5f0e7',
  colorScheme: 'light',
  // Nécessaire pour que env(safe-area-inset-*) renvoie autre chose que 0 sur iOS.
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
      <head>
        {/* Avant le premier rendu : autorise la révélation si, et seulement si,
            le visiteur n'a pas demandé de réduire les animations. */}
        <script dangerouslySetInnerHTML={{ __html: revealBootstrap }} />
      </head>
      <body>
        <AttributionCapture />
        <JsonLd data={organization()} />
        <JsonLd data={website()} />
        <SkipLink />
        <Header />
        <FloatingWhatsApp />
        <ConversionPrompt />
        <main id="contenu">{children}</main>
        <Footer />
        <RevealObserver />
      </body>
    </html>
  );
}
