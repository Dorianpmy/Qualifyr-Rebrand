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
  active: 'demandes' | 'planning' | 'tarifs' | 'factures';
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

        <nav className={styles.sidebarNav}>
          <Link
            href="/app"
            className={`${styles.navItem} ${active === 'demandes' ? styles.navItemActive : ''}`}
          >
            Demandes
          </Link>
          <Link
            href="/app/invoices"
            className={`${styles.navItem} ${active === 'factures' ? styles.navItemActive : ''}`}
          >
            Factures
          </Link>
          <span className={`${styles.navItem} ${styles.navSoon}`}>
            Insights <small>bientôt</small>
          </span>
          <span className={`${styles.navItem} ${styles.navSoon}`}>
            Planning <small>bientôt</small>
          </span>
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

      <div>{children}</div>
    </div>
  );
}
