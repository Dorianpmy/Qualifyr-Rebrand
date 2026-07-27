import { Cormorant_Garamond, Manrope } from 'next/font/google';

export const displayFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-display',
  display: 'swap',
});

export const bodyFont = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const fontClassName = `${displayFont.variable} ${bodyFont.variable}`;
