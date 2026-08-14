import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from '@/app/app/app.module.css';

export function AppShell({
  detailerName,
  detailerSlug,
  city,
  active,
  children,
}: {
  detailerName: string;
  detailerSlug: string;
  city?: string | null;
  active: 'demandes' | 'planning' | 'tarifs' | 'factures' | 'cases';
  children: ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <strong>{detailerName}</strong>
          <span>{city ?? 'Espace detailer'}</span>
          <span className={styles.brandTag}>Qualifyr</span>
        </div>

        <nav className={styles.sidebarNav} aria-label="Navigation espace pro">
          <Link
            href="/app"
            className={`${styles.navItem} ${active === 'demandes' ? styles.navItemActive : ''}`}
          >
            <span className={styles.navLabel}>Demandes</span>
          </Link>
          <Link
            href="/app/cases"
            className={`${styles.navItem} ${active === 'cases' ? styles.navItemActive : ''}`}
          >
            <span className={styles.navLabel}>Avant/Après</span>
          </Link>
          <Link
            href="/app/invoices"
            className={`${styles.navItem} ${active === 'factures' ? styles.navItemActive : ''}`}
          >
            <span className={styles.navLabel}>Factures</span>
          </Link>
          <Link
            href={`/reservation/${detailerSlug}`}
            className={`${styles.navItem} ${styles.navItemDesktopOnly}`}
            target="_blank"
          >
            <span className={styles.navLabel}>Page client ↗</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href={`/reservation/${detailerSlug}`} className={styles.navItem} target="_blank">
            Page publique ↗
          </Link>
          <form action="/api/app/logout" method="post">
            <button type="submit" className={styles.navItem}>
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      <div className={styles.shellMain}>{children}</div>
    </div>
  );
}
