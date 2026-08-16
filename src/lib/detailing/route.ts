import 'server-only';
import { distanceKm, type Point } from './geo';
import type { DashboardBooking } from './dashboard';

/**
 * Tournée du jour — plus proche voisin, pas plus court chemin optimal.
 *
 * Avec 5 à 15 arrêts par jour (le volume réel d'un laveur qui se déplace
 * seul), la différence entre un algorithme optimal et le plus proche voisin
 * est marginale, et celui-ci se vérifie à l'œil sur le terrain : à chaque
 * arrêt, le suivant est le plus près. Un professionnel qui regarde sa liste
 * doit pouvoir comprendre pourquoi elle est dans cet ordre sans y réfléchir.
 */

export type RouteStop = {
  readonly booking: DashboardBooking;
  readonly point: Point;
  readonly distanceFromPreviousKm: number;
};

export type TodayRoute = {
  readonly stops: readonly RouteStop[];
  readonly totalDistanceKm: number;
  /** Réservations du jour sans position exploitable — affichées à part. */
  readonly unplaceable: readonly DashboardBooking[];
};

/**
 * `{lat: 0, lon: 0}` est la valeur de repli d'`AddressPicker` quand une
 * adresse saisie n'a pas pu être géocodée — jamais une position réelle pour
 * une clientèle française. La confondre avec un vrai point enverrait la
 * tournée au large du Golfe de Guinée.
 */
function hasRealCoordinates(
  booking: DashboardBooking,
): booking is DashboardBooking & { latitude: number; longitude: number } {
  if (booking.latitude == null || booking.longitude == null) return false;
  if (booking.latitude === 0 && booking.longitude === 0) return false;
  return true;
}

export function orderRouteByNearestNeighbor(
  base: Point,
  bookings: readonly DashboardBooking[],
): TodayRoute {
  const remaining = bookings.filter(hasRealCoordinates);
  const unplaceable = bookings.filter((booking) => !hasRealCoordinates(booking));

  const stops: RouteStop[] = [];
  let current = base;
  let totalDistanceKm = 0;
  const pool = [...remaining];

  while (pool.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < pool.length; i += 1) {
      const candidate = pool[i];
      if (!candidate) continue;
      const point: Point = { lat: candidate.latitude, lon: candidate.longitude };
      const distance = distanceKm(current, point);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    const [next] = pool.splice(nearestIndex, 1);
    if (!next) break;
    const point: Point = { lat: next.latitude, lon: next.longitude };
    stops.push({ booking: next, point, distanceFromPreviousKm: nearestDistance });
    totalDistanceKm += nearestDistance;
    current = point;
  }

  return { stops, totalDistanceKm, unplaceable };
}
