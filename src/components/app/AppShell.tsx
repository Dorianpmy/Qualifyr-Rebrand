import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from '@/app/app/app.module.css';
import { QualifyrMark } from './QualifyrMark';

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
 *
 * **Cinq emplacements sur mobile, sept sur ordinateur.** La barre en portait
 * sept partout : à 375 px de large, les deux derniers sortaient de l'écran et
 * « Prestations » se lisait « Prestatio… ». Une barre d'onglets ne défile pas
 * — ce qui en dépasse est simplement perdu. Le mobile garde donc les quatre
 * destinations du quotidien plus le bouton central ; « Avant/Après » et
 * « Factures », consultées de loin en loin, deviennent deux liens en tête du
 * tableau de bord (`app/app/page.tsx`) plutôt que de disparaître. Sur
 * ordinateur, le menu est vertical : la place ne manque pas, les sept entrées
 * restent.
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

/**
 * Icône de chaque destination — un seul emoji, sur les deux barres.
 *
 * **Historique : d'abord réservé au menu de bureau (20/09/2026).** La
 * version d'origine gardait le pictogramme linéaire sur la barre mobile et
 * ajoutait l'emoji seulement sur le menu de bureau, par crainte qu'un
 * caractère de plus par libellé ne fasse déborder la barre mobile (cinq
 * colonnes calées au pixel, voir le débordement corrigé le 22/08/2026). Ce
 * risque supposait que l'emoji s'ajoute *à côté* du libellé ; il occupe en
 * réalité la même case que l'icône qu'il remplace (au-dessus du texte sur
 * mobile, comme le pictogramme avant lui), donc aucune largeur en plus. Ce
 * jour-là, Dorian a redemandé plus de « peps » : l'emoji est donc devenu
 * l'icône des deux barres (docs/03-direction-artistique.md §7.1, exception
 * étendue), et le jeu de pictogrammes linéaires ci-dessus a été retiré —
 * `Déconnexion` et le bouton central « Page client » gardent le leur, voir
 * plus bas.
 */
const emojis = {
  demandes: '📋',
  planning: '📅',
  prospection: '🔍',
  tarifs: '💶',
  hermes: '📣',
  cases: '📸',
  factures: '🧾',
  abonnement: '💳',
} as const;

/**
 * Icône « ouvrir en externe » du menu de bureau.
 *
 * Le symbole de marque (`QualifyrMark`) la remplace sur mobile, où le bouton
 * central est en relief et doit se distinguer des onglets. Sur ordinateur, au
 * contraire, « Page client » est une ligne de menu comme les autres : une
 * marque en blanc et vert au milieu de six glyphes gris attirerait l'œil sans
 * raison. Chaque contexte garde donc son icône, et la classe
 * `navIconDesktopOnly` décide laquelle s'affiche.
 */
const clientPageIcon = (
  <svg {...iconProps} className={`${styles.navIcon} ${styles.navIconDesktopOnly}`}>
    <path d="M14 4h6v6M20 4l-8.5 8.5" />
    <path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
  </svg>
);

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
  active:
    | 'demandes'
    | 'planning'
    | 'tarifs'
    | 'factures'
    | 'cases'
    | 'prospection'
    | 'hermes'
    | 'abonnement';
  children: ReactNode;
}) {
  /*
   * `desktopOnly` marque les entrées que la barre mobile ne peut pas
   * accueillir sans déborder. Elles restent dans le DOM et dans le menu de
   * bureau ; seule la barre du téléphone les masque, et le tableau de bord y
   * renvoie.
   *
   * « Prospection » devient « Prospect » : à cinq colonnes sur 320 px, chaque
   * emplacement dispose d'environ 58 px, ce qui ne suffit pas au mot entier
   * sans le tronquer.
   */
  const tabsBeforeFab = [
    { key: 'demandes', href: '/app', label: 'Demandes', emoji: emojis.demandes, desktopOnly: false },
    { key: 'planning', href: '/app/planning', label: 'Planning', emoji: emojis.planning, desktopOnly: false },
    { key: 'prospection', href: '/app/prospection', label: 'Prospect', emoji: emojis.prospection, desktopOnly: false },
  ] as const;

  const tabsAfterFab = [
    { key: 'tarifs', href: '/app/prestations', label: 'Prestations', emoji: emojis.tarifs, desktopOnly: false },
    /* Hermès, en `desktopOnly` : la barre mobile est pleine à cinq
       emplacements, et configurer une campagne — écrire un message, relire un
       aperçu — n'est pas quelque chose qu'on fait entre deux véhicules. Le
       tableau de bord y renvoie, comme pour « Avant/Après » et
       « Factures ». */
    { key: 'hermes', href: '/app/hermes', label: 'Démarchage', emoji: emojis.hermes, desktopOnly: true },
    { key: 'cases', href: '/app/cases', label: 'Avant/Après', emoji: emojis.cases, desktopOnly: true },
    { key: 'factures', href: '/app/invoices', label: 'Factures', emoji: emojis.factures, desktopOnly: true },
    /* L'abonnement n'est pas un module quotidien : il se consulte rarement,
       et n'a donc pas sa place dans les cinq emplacements du téléphone. Il
       reste joignable depuis chaque écran verrouillé, qui y renvoie. */
    {
      key: 'abonnement',
      href: '/app/abonnement',
      label: 'Abonnement',
      emoji: emojis.abonnement,
      desktopOnly: true,
    },
  ] as const;

  const renderTab = (tab: (typeof tabsBeforeFab)[number] | (typeof tabsAfterFab)[number]) => {
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
        /*
         * `app-tab` / `app-tab-active` sont des classes littérales, définies
         * dans `tailwind.css`. Elles ne sont pas décoratives : le bloc de
         * neutralisation de l'ancienne charte y vide tout `<a>` du dashboard
         * avec `!important`, et une déclaration `!important` venant d'un
         * module CSS (donc hors couche) ne peut pas gagner contre lui. Sans
         * ces deux classes, l'onglet perd sa couleur, son rayon, sa hauteur
         * et son état actif — c'est ce qui donnait à la barre son aspect de
         * liste de liens bruts.
         */
        className={`${styles.navItem} app-tab ${tab.desktopOnly ? styles.navItemDesktopOnly : ''} ${isActive ? `${styles.navItemActive} app-tab-active` : ''}`}
      >
        <span className={styles.navLabel}>{tab.label}</span>
        {/*
          L'emoji est l'icône des deux barres — voir le commentaire sur
          `emojis` plus haut pour l'historique. `order: -1` (dans
          `app.module.css`) le place avant le libellé : au-dessus sur la
          barre mobile (colonne), à gauche sur le menu de bureau (ligne).
          `aria-hidden` : le nom accessible du lien reste porté par
          `navLabel` seul.
        */}
        <span aria-hidden="true" className={styles.navEmoji}>
          {tab.emoji}
        </span>
      </Link>
    );
  };

  return (
    <div className={styles.shell} data-app="dashboard">
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <strong>{detailerName}</strong>
          <span>{city ?? 'Espace pro'}</span>
          <span className={styles.brandTag}>Qualifyr</span>
        </div>

        <nav className={styles.sidebarNav} aria-label="Navigation espace pro">
          {tabsBeforeFab.map(renderTab)}

          {/*
            La pastille surélevée au centre — reprise de la référence
            envoyée (barre basse avec un bouton rond en relief au milieu).

            **Elle porte désormais le symbole de la marque** (`QualifyrMark`)
            au lieu de l'icône « ouvrir en externe ». Cette icône générique
            était le troisième chevron/rectangle d'une barre qui en comptait
            déjà plusieurs : rien ne distinguait le bouton central des
            autres, alors que c'est le seul élément en relief. Un signe de
            marque, lui, ne peut être confondu avec aucun onglet.

            **Sa destination ne change pas** : la page de réservation
            publique, l'action qu'un professionnel montre ou partage le plus
            souvent. Le libellé reste dans le DOM pour le menu de bureau ; sur
            mobile il est masqué (aucun texte ne tient dans un cercle de cette
            taille) et le nom accessible vient d'`aria-label`.

            Sur desktop, `.navItemFab` s'efface et redevient une ligne de menu
            normale — le relief n'a de sens que dans une pilule flottante en
            bas d'un écran de téléphone.

            **Le cas du slug vide est traité, et c'était un vrai lien mort**
            (corrigé le 22/08/2026). Sept écrans passent `detailerSlug=""` :
            ce sont les états où le compte existe mais n'a pas encore de fiche
            professionnelle — abonnement inactif, module verrouillé, profil
            non créé. Le gabarit produisait alors `/reservation/`, une adresse
            qui n'existe pas, et le bouton le plus visible du produit envoyait
            sur une page d'erreur.

            Un bouton désactivé plutôt qu'un lien de repli : l'envoyer vers ses
            réglages serait une autre destination que celle annoncée, et un
            bouton qui fait autre chose que ce qu'il dit se paie plus cher
            qu'un bouton momentanément inerte. `title` explique ce qui manque,
            et `aria-disabled` le dit aux lecteurs d'écran sans retirer
            l'élément de la barre — sa disparition décalerait les quatre autres
            onglets d'un écran à l'autre.
          */}
          {detailerSlug ? (
            <Link
              href={`/reservation/${detailerSlug}`}
              className={`${styles.navItem} ${styles.navItemFab} app-tab app-tab-fab`}
              target="_blank"
              aria-label="Ouvrir ma page de réservation"
            >
              <QualifyrMark className={styles.navFabMark} />
              {clientPageIcon}
              <span className={styles.navLabel}>Page client</span>
            </Link>
          ) : (
            <span
              className={`${styles.navItem} ${styles.navItemFab} ${styles.navItemFabIdle} app-tab app-tab-fab`}
              aria-disabled="true"
              title="Votre page de réservation sera accessible ici une fois votre fiche professionnelle créée."
              aria-label="Page de réservation indisponible : fiche professionnelle non créée"
            >
              <QualifyrMark className={styles.navFabMark} />
              {clientPageIcon}
              <span className={styles.navLabel}>Page client</span>
            </span>
          )}

          {tabsAfterFab.map(renderTab)}
        </nav>

        <div className={styles.sidebarFooter}>
          <form action="/api/app/logout" method="post">
            <button type="submit" className={`${styles.navItem} app-tab`}>
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
