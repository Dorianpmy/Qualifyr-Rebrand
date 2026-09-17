import { NextResponse } from 'next/server';

/**
 * Recherche d'adresse, adossée à Nominatim (OpenStreetMap).
 *
 * **Pourquoi passer par notre serveur.** Nominatim impose un en-tête
 * d'identification et une limite d'une requête par seconde par usager. Appelé
 * directement depuis le navigateur, chaque visiteur apparaîtrait comme un
 * client anonyme distinct : le service finit par bloquer l'origine entière, et
 * la recherche d'adresse cesse de fonctionner pour tout le monde sans aucun
 * message d'erreur exploitable. En passant par ici, on s'identifie une fois,
 * on met en cache, et on maîtrise ce qui sort.
 *
 * **Pourquoi pas Google Places.** Le service est facturé à la frappe clavier
 * sur un champ à saisie assistée. Sur un tunnel public, la note dépend du
 * trafic et non des réservations — donc des visiteurs qui ne réservent pas
 * coûtent de l'argent.
 *
 * **Biais géographique autour du professionnel (17/09/2026).** Nominatim en
 * recherche libre classe par pertinence textuelle, sans notion de proximité :
 * un client d'un professionnel de Fréjus qui tape « Frejus » peut se voir
 * proposer en premier résultat un lieu-dit du même nom dans les Hautes-Alpes,
 * à 200 km — repéré sur une réservation réelle. `viewbox` (sans `bounded=1`,
 * donc une préférence et non un filtre dur) recentre le classement autour du
 * point de départ du professionnel quand il en a un (`base`), ou à défaut
 * autour de sa ville — un client qui réserve pour une seconde résidence plus
 * loin reste malgré tout trouvable, seulement moins souvent proposé en tête.
 */

export const runtime = 'nodejs';

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string>;
};

export type GeocodeSuggestion = {
  readonly label: string;
  readonly lat: number;
  readonly lon: number;
  readonly postalCode: string | null;
};

/** Demi-largeur de la zone de préférence, en degrés — grossièrement 100 km. */
const BIAS_MARGIN_DEG = 1;

function viewboxAround(lat: number, lon: number): string {
  return [lon - BIAS_MARGIN_DEG, lat + BIAS_MARGIN_DEG, lon + BIAS_MARGIN_DEG, lat - BIAS_MARGIN_DEG].join(
    ',',
  );
}

/**
 * Centre approximatif d'une ville, pour biaiser la recherche quand le
 * professionnel n'a pas encore renseigné son point de départ précis (cas
 * d'un professionnel qui ne facture aucun déplacement et n'a donc jamais eu
 * à le faire). Un seul résultat suffit ; mis en cache comme le reste.
 */
async function geocodeCityCenter(
  city: string,
  country: string,
): Promise<{ lat: number; lon: number } | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', city);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', country);

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Qualifyr/1.0 (contact@qualifyragence.com)' },
      // Le centre d'une ville ne change jamais : cache long.
      next: { revalidate: 2_592_000 },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as NominatimResult[];
    const first = data[0];
    if (!first?.lat || !first?.lon) return null;
    return { lat: Number(first.lat), lon: Number(first.lon) };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();
  const country = searchParams.get('country') === 'CH' ? 'ch' : 'fr';
  const biasLat = Number(searchParams.get('biasLat'));
  const biasLon = Number(searchParams.get('biasLon'));
  const biasCity = (searchParams.get('biasCity') ?? '').trim();

  // En dessous de trois caractères, la recherche renvoie des villes entières
  // et fait travailler le service pour rien.
  if (query.length < 3) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '5');
  url.searchParams.set('countrycodes', country);
  url.searchParams.set('accept-language', 'fr');

  if (Number.isFinite(biasLat) && Number.isFinite(biasLon)) {
    url.searchParams.set('viewbox', viewboxAround(biasLat, biasLon));
  } else if (biasCity.length > 0) {
    const center = await geocodeCityCenter(biasCity, country);
    if (center) url.searchParams.set('viewbox', viewboxAround(center.lat, center.lon));
  }

  try {
    const response = await fetch(url, {
      headers: {
        // Exigé par la politique d'usage de Nominatim : une identification
        // absente ou générique fait bloquer l'appelant.
        'User-Agent': 'Qualifyr/1.0 (contact@qualifyragence.com)',
      },
      // Les adresses ne bougent pas d'une heure à l'autre, et deux clients du
      // même quartier tapent souvent la même rue.
      next: { revalidate: 86_400 },
    });

    if (!response.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = (await response.json()) as NominatimResult[];

    const results: GeocodeSuggestion[] = data
      .filter((entry) => entry.lat && entry.lon && entry.display_name)
      .map((entry) => ({
        label: String(entry.display_name),
        lat: Number(entry.lat),
        lon: Number(entry.lon),
        postalCode: entry.address?.postcode ?? null,
      }));

    return NextResponse.json({ results });
  } catch {
    // Une recherche d'adresse indisponible ne doit pas casser la réservation :
    // le formulaire retombe sur la saisie libre.
    return NextResponse.json({ results: [] });
  }
}
