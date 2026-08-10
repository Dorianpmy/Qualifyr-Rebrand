export type NavItem = {
  readonly label: string;
  readonly href: LinkTarget;
};

/** Toutes les routes du site. Toute page ajoutée doit être déclarée ici. */
export type Route =
  | '/'
  | '/creation-site-web'
  | '/nettoyage-automobile'
  | '/conciergerie'
  | '/outil-conciergerie'
  | '/tarifs'
  | '/methode'
  | '/realisations'
  | '/realisations/sw-car-cleaning'
  | '/a-propos'
  | '/diagnostic'
  | '/estimation'
  | '/simulateur-revenus-locatifs'
  | '/contact'
  | '/blog'
  | '/mentions-legales'
  | '/politique-de-confidentialite';

/** Ancre interne à la page courante. */
export type Anchor = `#${string}`;

/** Ancre de la page d'accueil, utilisable depuis toutes les routes. */
export type HomeAnchor = `/#${string}`;

/** Ancre d'une route publique, par exemple la section Cookies de la politique. */
export type RouteAnchor = `${Route}#${string}`;

/** Route publique accompagnée de paramètres de campagne ou de préremplissage. */
export type RouteQuery = `${Route}?${string}`;

/** Cible d'un lien : route du site ou ancre. Interdit tout lien arbitraire. */
export type LinkTarget = Route | Anchor | HomeAnchor | RouteAnchor | RouteQuery;

export type Surface = 'page' | 'raised' | 'sunken' | 'inverse';
