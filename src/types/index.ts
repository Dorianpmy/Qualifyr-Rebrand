export type NavItem = {
  readonly label: string;
  readonly href: LinkTarget;
};

/** Toutes les routes du site. Toute page ajoutée doit être déclarée ici. */
export type Route =
  | '/'
  | '/creation-site-web'
  | '/nettoyage-automobile'
  | '/tarifs'
  | '/methode'
  | '/realisations'
  | '/realisations/sw-car-cleaning'
  | '/a-propos'
  | '/estimation'
  | '/contact'
  | '/blog'
  | '/mentions-legales'
  | '/politique-de-confidentialite';

/** Ancre interne à la page courante. */
export type Anchor = `#${string}`;

/** Ancre de la page d'accueil, utilisable depuis toutes les routes. */
export type HomeAnchor = `/#${string}`;

/**
 * Page publique de réservation d'un professionnel du nettoyage automobile.
 *
 * Séparée de `Route` parce qu'elle est paramétrée : le slug vient de la base,
 * il ne peut pas être énuméré.
 */
export type ReservationRoute = `/reservation/${string}`;

export type RouteAnchor = `${Route}#${string}`;

/** Route publique accompagnée de paramètres de campagne ou de préremplissage. */
export type RouteQuery = `${Route}?${string}`;

/** Cible d'un lien : route du site ou ancre. Interdit tout lien arbitraire. */
export type LinkTarget =
  | Route
  | ReservationRoute
  | Anchor
  | HomeAnchor
  | RouteAnchor
  | RouteQuery;

export type Surface = 'page' | 'raised' | 'sunken' | 'inverse';
