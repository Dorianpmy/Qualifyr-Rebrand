import 'server-only';
import type { Establishment, SegmentKey } from './sirene';

/**
 * Recensement par Google Places — la source qui couvre la Suisse.
 *
 * **Pourquoi une seconde source alors que Sirene existe.** Sirene est le
 * répertoire officiel des entreprises françaises, et il s'arrête à la
 * frontière. Un laveur suisse n'avait donc aucun prospect : `requestZone`
 * refusait sa zone avec `zone_non_couverte`, faute de savoir où chercher.
 * Google connaît les entreprises suisses ; il devient la source du
 * recensement là où Sirene n'a rien à dire.
 *
 * **Ce que cette source ne remplace pas.** En France, Sirene reste
 * préférable : il donne le SIRET, le code d'activité officiel et la tranche
 * d'effectif — trois informations que Google n'a pas, et dont la dernière
 * sert directement au tri (une flotte de cinquante véhicules ne se démarche
 * pas comme un artisan seul). Google est un annuaire commercial, pas un
 * registre : il dit qui a pignon sur rue, pas qui existe légalement.
 *
 * **Le rapport de secteur suisse doit donc dire ce qu'il est.** Pas de code
 * NAF, pas d'effectif, et un recensement fondé sur la présence dans un
 * annuaire plutôt que sur une immatriculation. Afficher des colonnes vides à
 * côté des colonnes françaises laisserait croire à une information manquante
 * là où l'information n'existe pas.
 *
 * ---
 *
 * **Text Search plutôt que Nearby Search, et c'est un choix.** Nearby Search
 * exige des coordonnées : il faudrait géocoder chaque code postal, donc un
 * appel supplémentaire par zone et une dépendance de plus. Text Search
 * accepte « garage automobile 1700 Fribourg » et se débrouille. Même prix,
 * une étape en moins, et le résultat est meilleur pour les zones rurales où
 * un rayon en kilomètres attrape surtout des champs.
 *
 * **Les champs demandés déterminent la facture.** Google facture par palier :
 * demander les avis, les photos ou les horaires fait passer l'appel de 32 à
 * 40 $ les mille. On ne demande donc que le nom, l'adresse, le site et le
 * téléphone — tout ce dont Hermès a besoin, rien de plus. Ajouter un champ
 * ici sans vérifier son palier peut multiplier le coût par plus d'un tiers.
 */

const API = 'https://places.googleapis.com/v1/places:searchText';

/**
 * Champs demandés, et eux seuls.
 *
 * `id` sert d'identifiant de déduplication à la place du SIRET, absent hors
 * de France (voir `external_id`, migration 023).
 */
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.websiteUri',
  'places.nationalPhoneNumber',
].join(',');

/**
 * Requête textuelle par segment.
 *
 * **C'est une approximation, pas une traduction du code NAF.** Sirene classe
 * par activité déclarée ; Google répond à une recherche en langage courant.
 * Les résultats se recoupent largement pour les garages et les loueurs, moins
 * pour les flottes — une société de transport n'a pas toujours de fiche, et
 * celles qui en ont sont référencées sous des libellés très variables.
 *
 * Les VTC restent le point faible, ici comme dans OpenStreetMap : un
 * chauffeur indépendant n'a ni local ni vitrine, donc rarement une fiche. La
 * requête est conservée parce qu'elle ramène les centrales et les loueurs
 * avec chauffeur, mais il ne faut pas en attendre le même rendement que pour
 * les garages.
 */
const SEGMENT_QUERIES: Readonly<Record<SegmentKey, string>> = {
  loueurs: 'location de voitures',
  vtc: 'société de VTC chauffeur privé',
  concessions: 'garage automobile concession',
  flottes: 'entreprise de transport routier',
};

type PlacesResponse = {
  readonly places?: readonly {
    readonly id?: string;
    readonly displayName?: { readonly text?: string };
    readonly formattedAddress?: string;
    readonly websiteUri?: string;
    readonly nationalPhoneNumber?: string;
  }[];
  readonly error?: { readonly message?: string };
};

/** Un établissement recensé par Google, sans les champs propres à Sirene. */
export type PlaceEstablishment = Omit<Establishment, 'siret' | 'nafCode' | 'workforceRange'> & {
  /** Identifiant Google, stable dans le temps. Remplace le SIRET pour la
   *  déduplication : deux zones voisines ramènent les mêmes entreprises. */
  readonly externalId: string;
  readonly website: string | null;
  readonly phone: string | null;
};

/**
 * Extrait la ville d'une adresse formatée par Google.
 *
 * Format suisse : « Route des Alpes 12, 1700 Fribourg, Suisse ». On prend le
 * segment qui suit le code postal, dans l'avant-dernière partie.
 *
 * **Renvoie `null` plutôt que de deviner.** Une ville fausse apparaîtrait
 * dans le message envoyé au prospect via `{{ville}}` — mieux vaut la formule
 * de repli « votre secteur » qu'une localité inventée.
 */
export function cityFromFormattedAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const parts = address.split(',').map((p) => p.trim());
  // L'avant-dernière partie porte « 1700 Fribourg » ; la dernière est le pays.
  const locality = parts.at(-2);
  if (!locality) return null;
  const withoutPostal = locality.replace(/^\d{4,5}\s+/, '').trim();
  return withoutPostal.length > 0 ? withoutPostal : null;
}

/** Code postal extrait de la même adresse, `null` si absent. */
export function postalCodeFromFormattedAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const match = address.match(/\b(\d{4,5})\b/);
  return match?.[1] ?? null;
}

/**
 * Une requête Google par segment et par code postal.
 *
 * **Aucune exception ne remonte.** Un quota dépassé ou une clé invalide doit
 * dégrader le recensement, pas interrompre le traitement de la zone : les
 * segments déjà obtenus sont conservés et l'erreur est rapportée à part,
 * exactement comme `scanZone` le fait pour Sirene.
 */
export async function scanZoneGoogle(input: {
  readonly postalCodes: readonly string[];
  readonly countryLabel: string;
  readonly perSegment?: number;
}): Promise<{
  readonly establishments: readonly PlaceEstablishment[];
  readonly errors: readonly string[];
}> {
  const apiKey = process.env['GOOGLE_PLACES_API_KEY'];
  if (!apiKey) {
    return { establishments: [], errors: ['GOOGLE_PLACES_API_KEY manquante'] };
  }

  const found: PlaceEstablishment[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  const perSegment = input.perSegment ?? 20;

  for (const postalCode of input.postalCodes) {
    for (const [segment, query] of Object.entries(SEGMENT_QUERIES) as [SegmentKey, string][]) {
      try {
        const response = await fetch(API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': FIELD_MASK,
          },
          body: JSON.stringify({
            textQuery: `${query} ${postalCode} ${input.countryLabel}`,
            maxResultCount: perSegment,
            languageCode: 'fr',
          }),
          cache: 'no-store',
        });

        const payload = (await response.json()) as PlacesResponse;

        if (!response.ok || payload.error) {
          errors.push(`${segment}/${postalCode}: ${payload.error?.message ?? response.status}`);
          continue;
        }

        for (const place of payload.places ?? []) {
          const externalId = place.id;
          const name = place.displayName?.text;
          if (!externalId || !name) continue;
          if (seen.has(externalId)) continue;
          seen.add(externalId);

          found.push({
            externalId,
            name,
            segment,
            address: place.formattedAddress ?? null,
            postalCode: postalCodeFromFormattedAddress(place.formattedAddress) ?? postalCode,
            city: cityFromFormattedAddress(place.formattedAddress),
            website: place.websiteUri ?? null,
            phone: place.nationalPhoneNumber ?? null,
          });
        }
      } catch (cause) {
        errors.push(`${segment}/${postalCode}: ${(cause as Error).message}`);
      }
    }
  }

  return { establishments: found, errors };
}
