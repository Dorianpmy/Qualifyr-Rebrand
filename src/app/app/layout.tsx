import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import styles from './app.module.css';

export const metadata: Metadata = {
  title: 'Espace detailer — Qualifyr',
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return <div className={styles.shell}>{children}</div>;
}
