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
 * L'outil prend la place de « Contact » : le bouton WhatsApp de l'en-tête et la
 * colonne du pied de page couvrent déjà la prise de contact, alors que le
 * produit n'avait aucune entrée. Il est placé avant les tarifs, parce qu'on
 * regarde un prix après avoir compris ce qu'on achète.
 */
export const primaryNav: readonly NavItem[] = [
  { label: 'Expertise', href: '/#expertise' },
  { label: 'Réalisation', href: '/#sw-car-cleaning' },
  { label: 'Outil', href: '/outil-conciergerie' },
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
