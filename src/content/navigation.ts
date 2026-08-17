import type { NavItem } from '@/types';

/**
 * Navigation du site.
 * Recentrée 100 % sur le nettoyage automobile / detailing.
 * La verticale conciergerie a été retirée.
 */

/** Libellés courts des routes, pour le fil d'Ariane. */
export const routeLabels: Readonly<Record<string, string>> = {
  '/': 'Accueil',
  '/creation-site-web': 'Création de site web',
  '/nettoyage-automobile': 'Nettoyage automobile',
  '/tarifs': 'Tarifs',
  '/methode': 'Méthode',
  '/realisations': 'Réalisations',
  '/realisations/sw-car-cleaning': 'SW Carcleaning',
  '/a-propos': 'À propos',
  '/estimation': 'Estimation',
  '/contact': 'Contact',
  '/blog': 'Journal',
  '/mentions-legales': 'Mentions légales',
  '/politique-de-confidentialite': 'Politique de confidentialité',
};

/**
 * Menu principal — cinq entrées.
 * On segmente par métier : le visiteur se reconnaît avant de comprendre
 * ce que Qualifyr vend.
 */
export const primaryNav: readonly NavItem[] = [
  { label: 'Nettoyage automobile', href: '/nettoyage-automobile' },
  { label: 'Réalisations', href: '/realisations' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'Journal', href: '/blog' },
  { label: 'À propos', href: '/a-propos' },
];

/**
 * Pied de page — une entrée par destination réelle.
 */
export const footerServiceNav: readonly NavItem[] = [
  { label: 'Site pour laveurs auto à domicile', href: '/nettoyage-automobile' },
  { label: 'Création et refonte de site', href: '/creation-site-web' },
  { label: 'Tarifs', href: '/tarifs' },
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
