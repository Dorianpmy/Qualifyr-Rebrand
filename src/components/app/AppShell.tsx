import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from '@/app/app/app.module.css';

/**
 * Coque de l'espace pro.
 *
 * **Le mobile n'est pas une version réduite ici, c'est le cas normal.** Le
 * detailer consulte ses demandes debout, entre deux véhicules, une main sur
 * le téléphone. Le bureau est l'exception — il n'y passe que pour régler ses
 * tarifs.
 *
 * D'où la barre d'onglets basse plutôt qu'un menu latéral replié derrière un
 * bouton hamburger : sur un téléphone tenu à une main, le haut de l'écran est
 * hors de portée du pouce. Un menu qu'il faut ouvrir avant de naviguer ajoute
 * un geste à chaque déplacement.
 *
 * **Des icônes, pas seulement du texte.** Quatre libellés côte à côte dans une
 * pilule tiennent sur un grand téléphone et débordent sur un petit. L'icône
 * porte la reconnaissance, le libellé la confirme — c'est la convention iOS et
 * Material, et elle vaut ici parce que le detailer n'apprendra pas une
 * grammaire propre à Qualifyr.
 */

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  className: styles.navIcon,
};

const icons = {
  demandes: (
    <svg {...iconProps}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  planning: (
    <svg {...iconProps}>
      <path d="M12 21.2s7-7.4 7-12.3a7 7 0 1 0-14 0c0 4.9 7 12.3 7 12.3Z" />
      <circle cx="12" cy="8.9" r="2.4" />
    </svg>
  ),
  tarifs: (
    <svg {...iconProps}>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4.8A2 2 0 0 1 4.8 2.8H12a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </svg>
  ),
  cases: (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M12 4v16" />
      <path d="m6.5 15 2-2.5 2 2" />
      <circle cx="16.5" cy="9" r="1.3" />
    </svg>
  ),
  factures: (
    <svg {...iconProps}>
      <path d="M6 2.8h12v18.4l-3-1.8-3 1.8-3-1.8-3 1.8Z" />
      <path d="M9.5 8.5h5M9.5 12.5h5" />
    </svg>
  ),
  prospection: (
    <svg {...iconProps}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.6-4.6" />
    </svg>
  ),
} as const;

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
  active: 'demandes' | 'planning' | 'tarifs' | 'factures' | 'cases' | 'prospection';
  children: ReactNode;
}) {
  const tabs = [
    { key: 'demandes', href: '/app', label: 'Demandes', icon: icons.demandes },
    { key: 'planning', href: '/app/planning', label: 'Planning', icon: icons.planning },
    { key: 'prospection', href: '/app/prospection', label: 'Prospection', icon: icons.prospection },
    { key: 'tarifs', href: '/app/prestations', label: 'Prestations', icon: icons.tarifs },
    { key: 'cases', href: '/app/cases', label: 'Avant/Après', icon: icons.cases },
    { key: 'factures', href: '/app/invoices', label: 'Factures', icon: icons.factures },
  ] as const;

  return (
    <div className={styles.shell} data-app="dashboard">
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <strong>{detailerName}</strong>
          <span>{city ?? 'Espace pro'}</span>
          <span className={styles.brandTag}>Qualifyr</span>
        </div>

        <nav className={styles.sidebarNav} aria-label="Navigation espace pro">
          {tabs.map((tab) => {
            const isActive = active === tab.key;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                /*
                 * `aria-current` plutôt qu'une classe seule : un lecteur
                 * d'écran annonce « page actuelle » sans avoir à deviner ce
                 * que signifie un contour coloré.
                 */
                aria-current={isActive ? 'page' : undefined}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                {tab.icon}
                <span className={styles.navLabel}>{tab.label}</span>
              </Link>
            );
          })}

          <Link
            href={`/reservation/${detailerSlug}`}
            className={`${styles.navItem} ${styles.navItemDesktopOnly}`}
            target="_blank"
          >
            <svg {...iconProps}>
              <path d="M14 4h6v6M20 4l-8.5 8.5" />
              <path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
            </svg>
            <span className={styles.navLabel}>Page client</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <form action="/api/app/logout" method="post">
            <button type="submit" className={styles.navItem}>
              <svg {...iconProps}>
                <path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H9" />
                <path d="M16 16l4-4-4-4M20 12H9" />
              </svg>
              <span className={styles.navLabel}>Déconnexion</span>
            </button>
          </form>
        </div>
      </aside>

      <div className={styles.shellMain}>{children}</div>
    </div>
  );
}
