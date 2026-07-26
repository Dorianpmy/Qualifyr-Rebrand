import Link from 'next/link';
import { Fragment } from 'react';
import { routeLabels } from '@/content/navigation';
import type { Route } from '@/types';
import styles from './Breadcrumbs.module.css';

type Crumb = {
  readonly label: string;
  readonly href: Route;
};

type BreadcrumbsProps = {
  /** Chemin depuis l'accueil, page courante exclue. */
  trail?: readonly Crumb[];
  /** Page courante — libellé affiché sans lien. */
  current: string;
};

/**
 * Fil d'Ariane. Réservé aux pages de second niveau (légales, confirmations) :
 * l'arborescence est plate, il serait inutile — donc bruyant — sur les pages
 * principales.
 *
 * La page courante est le dernier élément, sans lien, marquée `aria-current`.
 */
export function Breadcrumbs({ trail, current }: BreadcrumbsProps) {
  const items: readonly Crumb[] = trail ?? [{ label: routeLabels['/'] ?? 'Accueil', href: '/' }];

  return (
    <nav className={styles.nav} aria-label="Fil d’Ariane">
      <ol className={styles.list}>
        {items.map((item) => (
          <Fragment key={item.href}>
            <li>
              <Link href={item.href} className={styles.link}>
                {item.label}
              </Link>
            </li>
            <li className={styles.separator} aria-hidden="true">
              /
            </li>
          </Fragment>
        ))}
        <li className={styles.current} aria-current="page">
          {current}
        </li>
      </ol>
    </nav>
  );
}
