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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();
  const country = searchParams.get('country') === 'CH' ? 'ch' : 'fr';

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
