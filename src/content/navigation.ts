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
  '/methode': 'Méthode',
  '/realisations': 'Réalisations',
  '/realisations/sw-car-cleaning': 'SW Carcleaning',
  '/laboratoire': 'Laboratoire',
  '/a-propos': 'À propos',
  '/diagnostic': 'Diagnostic',
  '/estimation': 'Estimation',
  '/contact': 'Contact',
  '/blog': 'Journal',
  '/mentions-legales': 'Mentions légales',
  '/politique-de-confidentialite': 'Politique de confidentialité',
};

export const primaryNav: readonly NavItem[] = [
  { label: 'Expertise', href: '/#expertise' },
  { label: 'Réalisation', href: '/#sw-car-cleaning' },
  { label: 'Laboratoire', href: '/laboratoire' },
  { label: 'Journal', href: '/blog' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
];

export const footerServiceNav: readonly NavItem[] = [
  { label: 'Nettoyage automobile', href: '/nettoyage-automobile' },
  { label: 'Conciergeries', href: '/conciergerie' },
  { label: 'Création de site internet', href: '/creation-site-web' },
  { label: 'Refonte de site', href: '/creation-site-web' },
  { label: 'Application web', href: '/diagnostic' },
  { label: 'Produit web', href: '/diagnostic' },
  { label: 'Parcours de demande', href: '/methode' },
  { label: 'Diagnostic', href: '/diagnostic' },
  { label: 'Estimation', href: '/estimation' },
];

export const footerCompanyNav: readonly NavItem[] = [
  { label: 'Réalisations', href: '/realisations' },
  { label: 'Étude de cas SW Car Cleaning', href: '/realisations/sw-car-cleaning' },
  { label: 'Laboratoire', href: '/laboratoire' },
  { label: 'Méthode', href: '/methode' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
  { label: 'Journal', href: '/blog' },
];

export const legalNav: readonly NavItem[] = [
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'Politique de confidentialité', href: '/politique-de-confidentialite' },
  { label: 'Cookies', href: '/politique-de-confidentialite#cookies' },
];
