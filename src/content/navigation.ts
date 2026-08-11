import type { NavItem } from '@/types';

/**
 * Navigation du site.
 * Structure figée par docs/02-arborescence.md : huit pages, pas une de plus
 * en V1. « Accueil » n'apparaît pas dans le menu, le logo y renvoie.
 * « Contact » vit dans le pied de page : l'entrée du parcours est le
 * diagnostic, pas un formulaire générique.
 */

/** Libellés courts des routes, pour le fil d'Ariane. */
export const routeLabels: Readonly<Record<string, string>> = {
  '/': 'Accueil',
  '/creation-site-web': 'Création de site web',
  '/nettoyage-automobile': 'Nettoyage automobile',
  '/conciergerie': 'Conciergerie',
  '/outil-conciergerie': 'Outil conciergerie',
  '/tarifs': 'Tarifs',
  '/methode': 'Méthode',
  '/realisations': 'Réalisations',
  '/realisations/sw-car-cleaning': 'SW Carcleaning',
  '/a-propos': 'À propos',
  '/diagnostic': 'Diagnostic',
  '/estimation': 'Estimation',
  '/contact': 'Contact',
  '/blog': 'Journal',
  '/mentions-legales': 'Mentions légales',
  '/politique-de-confidentialite': 'Politique de confidentialité',
};

/**
 * Menu principal — six entrées, jamais sept.
 *
 * **On segmente par métier, pas par produit** (arbitrage du 11/08/2026, cf.
 * `docs/11-refonte-copywriting.md`, §1.2). Les deux premières entrées sont des
 * portes : le visiteur se reconnaît avant d'avoir à comprendre ce que Qualifyr
 * vend. Un menu qui liste des produits impose l'ordre inverse — savoir ce qu'on
 * veut acheter avant de savoir si on est au bon endroit.
 *
 * Trois décisions à ne pas défaire sans raison :
 *
 * - `Expertise` et `Réalisation` pointaient vers des ancres de l'accueil. Un
 *   lien de menu qui fait défiler la page où l'on se trouve déjà donne
 *   l'impression d'une navigation cassée. `Réalisations` devient la vraie page.
 * - `Outil` sort du menu. Le libellé ne disait ni pour qui, ni pourquoi, et sa
 *   cible passe forcément par `/conciergerie`, qui l'y mène. Le produit reste
 *   atteignable depuis cette page, l'accueil (section 04), les pages de ville,
 *   le simulateur, la table des tarifs et le pied de page : le retirer d'ici
 *   ne l'orpheline pas.
 * - Le nettoyage automobile ne voit jamais un produit qui ne le concerne pas.
 */
export const primaryNav: readonly NavItem[] = [
  { label: 'Conciergeries', href: '/conciergerie' },
  { label: 'Nettoyage automobile', href: '/nettoyage-automobile' },
  { label: 'Réalisations', href: '/realisations' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'Journal', href: '/blog' },
  { label: 'À propos', href: '/a-propos' },
];

/**
 * Pied de page — une entrée par destination réelle.
 *
 * Les doublons précédents (« Refonte de site » et « Création de site internet »
 * pointaient au même endroit, « Application web » et « Produit web » aussi)
 * allongeaient la colonne sans rien apporter : un lien répété ne renforce pas
 * le maillage interne, il dilue l'attention et le budget d'exploration.
 */
export const footerServiceNav: readonly NavItem[] = [
  { label: 'Site pour nettoyage automobile et detailing', href: '/nettoyage-automobile' },
  { label: 'Site pour conciergerie', href: '/conciergerie' },
  { label: 'Outil d’acquisition pour conciergerie', href: '/outil-conciergerie' },
  { label: 'Simulateur de revenus locatifs', href: '/simulateur-revenus-locatifs' },
  { label: 'Création et refonte de site', href: '/creation-site-web' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'Diagnostic', href: '/diagnostic' },
];

export const footerCompanyNav: readonly NavItem[] = [
  { label: 'Réalisations', href: '/realisations' },
  { label: 'Méthode', href: '/methode' },
  { label: 'Journal', href: '/blog' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
];

export const legalNav: readonly NavItem[] = [
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'Politique de confidentialité', href: '/politique-de-confidentialite' },
  { label: 'Cookies', href: '/politique-de-confidentialite#cookies' },
];
