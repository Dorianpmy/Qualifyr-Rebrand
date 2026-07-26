import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SkipLink } from '@/components/layout/SkipLink';
import { RevealObserver, revealBootstrap } from '@/components/motion/RevealObserver';
import { JsonLd } from '@/components/seo/JsonLd';
import { fontClassName } from '@/lib/fonts';
import { openGraphImage } from '@/lib/metadata';
import { organization, website } from '@/lib/structured-data';
import { brand } from '@/content/brand';
import { site } from '@/content/site';
import '@/styles/globals.css';

export const metadata: Metadata = {
  // Base de toutes les URL relatives : canonical, Open Graph, images.
  metadataBase: new URL(site.url),
  title: {
    default: 'Qualifyr — Développez votre activité de nettoyage automobile',
    template: `%s — ${brand.fullName}`,
  },
  description: brand.descriptor,
  applicationName: brand.fullName,
  authors: [{ name: brand.fullName, url: site.url }],
  creator: brand.fullName,
  publisher: brand.fullName,
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: 'website',
    locale: site.locale,
    siteName: brand.fullName,
    url: site.url,
    images: [openGraphImage],
  },
  twitter: { card: 'summary_large_image', images: [openGraphImage.url] },
  robots: site.indexable
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
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
    <html lang={site.lang} className={fontClassName}>
      <head>
        {/* Avant le premier rendu : autorise la révélation si, et seulement si,
            le visiteur n'a pas demandé de réduire les animations. */}
        <script dangerouslySetInnerHTML={{ __html: revealBootstrap }} />
      </head>
      <body>
        <JsonLd data={organization()} />
        <JsonLd data={website()} />
        <SkipLink />
        <Header />
        <main id="contenu">{children}</main>
        <Footer />
        <RevealObserver />
      </body>
    </html>
  );
}
