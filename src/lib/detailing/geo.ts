/**
 * Géographie du tunnel : distance et cadrage de carte.
 *
 * Aucune dépendance, aucun appel réseau — le calcul doit tourner aussi bien
 * dans le navigateur pendant que le client saisit son adresse que côté serveur
 * au moment de figer le devis. Un prix calculé deux fois par deux codes
 * différents finit toujours par diverger.
 */

export type Point = { readonly lat: number; readonly lon: number };

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Distance à vol d'oiseau entre deux points.
 *
 * **Ce n'est pas la distance routière**, et c'est assumé. Calculer un
 * itinéraire réel exigerait un service payant appelé à chaque frappe clavier.
 * Le rapport entre trajet routier et vol d'oiseau tourne autour de 1,3 en
 * zone urbaine ; le professionnel règle son tarif au kilomètre en conséquence,
 * une fois, plutôt que de payer un calcul d'itinéraire à chaque visiteur.
 */
export function distanceKm(from: Point, to: Point): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLon = toRadians(to.lon - from.lon);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * URL d'une carte OpenStreetMap centrée sur un point, avec un repère.
 *
 * **Pourquoi une iframe et pas une bibliothèque de cartographie.** Le projet
 * n'a que cinq dépendances. Ajouter Leaflet, c'est 40 ko de JavaScript et une
 * feuille de style tierce sur un tunnel dont l'argument principal est la
 * rapidité — pour un gain limité à faire glisser un repère. L'adresse
 * géocodée place déjà le point au bon numéro de rue.
 */
/**
 * Carte Google, en iframe, **sans clé d'API**.
 *
 * `maps.google.com/maps?q=…&output=embed` est le point d'entrée historique :
 * il ne demande ni clé, ni facturation, ni domaine autorisé. L'API Embed
 * officielle exige une clé, un projet Google Cloud et une carte bancaire — pour
 * afficher un point sur une carte, c'est disproportionné, et ça bloquerait le
 * jour où le quota gratuit change.
 *
 * **Pourquoi Google plutôt qu'OpenStreetMap.** Le client reconnaît la carte
 * qu'il utilise tous les jours. Sur un écran de réservation où il vérifie que
 * le professionnel viendra au bon endroit, la familiarité de la carte fait
 * partie de la réassurance — une carte inhabituelle donne l'impression d'un
 * outil approximatif.
 *
 * `z=16` cadre un pâté de maisons : assez près pour reconnaître sa rue, assez
 * loin pour situer le quartier.
 */
export function googleMapEmbedUrl(point: Point, zoom = 16): string {
  const params = new URLSearchParams({
    q: `${point.lat},${point.lon}`,
    z: String(zoom),
    output: 'embed',
    hl: 'fr',
  });

  return `https://maps.google.com/maps?${params.toString()}`;
}

/** Ouvre l'adresse dans l'application Maps du téléphone. */
export function googleMapsLink(point: Point): string {
  return `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lon}`;
}

export function osmEmbedUrl(point: Point, zoomSpanDegrees = 0.006): string {
  const west = point.lon - zoomSpanDegrees;
  const south = point.lat - zoomSpanDegrees / 2;
  const east = point.lon + zoomSpanDegrees;
  const north = point.lat + zoomSpanDegrees / 2;

  const params = new URLSearchParams({
    bbox: `${west},${south},${east},${north}`,
    layer: 'mapnik',
    marker: `${point.lat},${point.lon}`,
  });

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

/**
 * Lien d'itinéraire ouvert dans l'application de cartographie du téléphone.
 *
 * Le schéma `geo:` est celui d'Android ; iOS l'ignore. `maps.apple.com` est
 * compris par iOS et redirige ailleurs. On reste donc sur une URL universelle
 * qui fonctionne partout, quitte à ouvrir un navigateur plutôt qu'une
 * application native.
 */
export function directionsUrl(point: Point): string {
  return `https://www.openstreetmap.org/directions?to=${point.lat}%2C${point.lon}`;
}
