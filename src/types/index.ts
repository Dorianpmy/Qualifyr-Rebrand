export type NavItem = {
  readonly label: string;
  readonly href: LinkTarget;
};

/** Toutes les routes du site. Toute page ajoutée doit être déclarée ici. */
export type Route =
  | '/'
  | '/methode'
  | '/realisations'
  | '/realisations/sw-car-cleaning'
  | '/a-propos'
  | '/diagnostic'
  | '/contact'
  | '/mentions-legales'
  | '/politique-de-confidentialite';

/** Ancre interne à la page courante. */
export type Anchor = `#${string}`;

/** Ancre de la page d'accueil, utilisable depuis toutes les routes. */
export type HomeAnchor = `/#${string}`;

/** Cible d'un lien : route du site ou ancre. Interdit tout lien arbitraire. */
export type LinkTarget = Route | Anchor | HomeAnchor;

export type Surface = 'page' | 'raised' | 'sunken' | 'inverse';
