import 'server-only';

/**
 * Client de l'API Sirene (INSEE) — la source des prospects.
 *
 * **Pourquoi Sirene et pas un modèle de langage.** Un modèle à qui l'on
 * demande « quels sont les loueurs de Lyon 3e » produit des noms plausibles,
 * des adresses plausibles et des numéros plausibles. Tous faux. C'est l'erreur
 * qui tue ce genre de produit, et elle se découvre le jour où un detailer
 * appelle un garage qui n'existe pas. Sirene est le répertoire officiel des
 * entreprises françaises : les établissements y sont réels par construction.
 *
 * **Pourquoi pas Google Places en première intention.** Places est facturé à
 * l'appel et ne connaît que ce qui a une fiche. Sirene est gratuit et
 * exhaustif — y compris les flottes d'entreprise, qui n'ont aucune raison
 * d'avoir une fiche Google. Places sert à enrichir dans un second temps, sur
 * les seuls établissements déjà retenus.
 *
 * **Le quota est de 30 requêtes par minute.** On interroge donc par lot, un
 * segment à la fois, avec une pause entre deux appels. Dépasser le quota
 * renvoie un 429 et fait blacklister la clé.
 *
 * Documentation : https://portail-api.insee.fr/
 */

const API = 'https://api.insee.fr/api-sirene/3.11/siret';

/**
 * Les segments, définis par leurs codes d'activité officiels.
 *
 * **Aucun particulier.** Le RGPD autorise la prospection B2B sans
 * consentement préalable, sur la base de l'intérêt légitime ; le B2C exige un
 * consentement recueilli avant tout contact. Un répertoire d'entreprises ne
 * contient de toute façon pas de particuliers — la contrainte légale et la
 * source de données pointent dans la même direction.
 */
export const SEGMENTS = [
  {
    key: 'loueurs',
    label: 'Loueurs de véhicules',
    naf: ['77.11Z'],
    /** Pourquoi ce segment vaut le déplacement, en une phrase pour le rapport. */
    why: 'Véhicules nettoyés entre chaque location, toute l’année.',
  },
  {
    key: 'vtc',
    label: 'Taxis et VTC',
    naf: ['49.32Z'],
    why: 'Un intérieur propre est leur outil de travail — et leur note client.',
  },
  {
    key: 'concessions',
    label: 'Concessions et garages',
    naf: ['45.11Z', '45.19Z', '45.20A', '45.20B'],
    why: 'Préparation avant livraison et remise en état des reprises.',
  },
  {
    key: 'flottes',
    label: 'Transport et flottes',
    naf: ['49.41A', '49.41B', '49.39B', '53.20Z'],
    why: 'Plusieurs véhicules, un seul interlocuteur, un budget annuel.',
  },
] as const;

export type SegmentKey = (typeof SEGMENTS)[number]['key'];

export type Establishment = {
  readonly siret: string;
  readonly name: string;
  readonly nafCode: string | null;
  readonly segment: SegmentKey;
  readonly address: string | null;
  readonly postalCode: string | null;
  readonly city: string | null;
  readonly workforceRange: string | null;
};

/** Réponse partielle de Sirene — seuls les champs consommés sont typés. */
type SireneEtablissement = {
  siret?: string;
  trancheEffectifsEtablissement?: string;
  uniteLegale?: {
    denominationUniteLegale?: string | null;
    nomUniteLegale?: string | null;
    prenom1UniteLegale?: string | null;
    activitePrincipaleUniteLegale?: string | null;
  };
  adresseEtablissement?: {
    numeroVoieEtablissement?: string | null;
    typeVoieEtablissement?: string | null;
    libelleVoieEtablissement?: string | null;
    codePostalEtablissement?: string | null;
    libelleCommuneEtablissement?: string | null;
  };
  periodesEtablissement?: readonly {
    etatAdministratifEtablissement?: string;
    activitePrincipaleEtablissement?: string | null;
  }[];
};

function token(): string {
  const key = process.env.INSEE_API_KEY;
  if (!key) {
    throw new Error(
      'INSEE_API_KEY manquante. Sans elle, aucune zone ne peut être analysée.',
    );
  }
  return key;
}

/**
 * Nom lisible d'un établissement.
 *
 * Une entreprise individuelle n'a pas de dénomination : Sirene ne renvoie que
 * le nom et le prénom du dirigeant. Sans ce repli, un tiers des lignes
 * s'afficherait « undefined ».
 */
function readName(unit: SireneEtablissement['uniteLegale']): string | null {
  if (!unit) return null;
  if (unit.denominationUniteLegale) return unit.denominationUniteLegale;

  const person = [unit.prenom1UniteLegale, unit.nomUniteLegale].filter(Boolean).join(' ');
  return person.trim() || null;
}

function readAddress(address: SireneEtablissement['adresseEtablissement']): string | null {
  if (!address) return null;
  const parts = [
    address.numeroVoieEtablissement,
    address.typeVoieEtablissement,
    address.libelleVoieEtablissement,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * Interroge un segment sur un code postal.
 *
 * **La recherche porte sur le code postal, pas sur un rayon.** Sirene ne sait
 * pas chercher dans un cercle. Le rayon est traité en amont, en établissant la
 * liste des codes postaux qu'il recouvre — approximation assumée : un rayon de
 * 15 km n'a pas de frontière administrative, et prétendre le contraire serait
 * un faux raffinement.
 */
async function fetchSegment(
  postalCode: string,
  segment: (typeof SEGMENTS)[number],
  limit: number,
): Promise<readonly Establishment[]> {
  /*
   * `activitePrincipaleEtablissement` et `etatAdministratifEtablissement` sont
   * des variables « historisées » — elles vivent dans periodesEtablissement,
   * pas à la racine de l'établissement, parce qu'elles changent dans le temps
   * (un établissement change d'activité, ferme, rouvre). Sirene exige de les
   * interroger via periode(...), sans quoi il renvoie 400 « Erreur de syntaxe
   * dans le paramètre q » — silencieux sur la vraie cause. `codePostalEtablissement`
   * n'est pas historisé et reste hors de periode().
   *
   * `etatAdministratifEtablissement:A` exclut les établissements fermés — sans
   * ce filtre, un tiers des résultats sont des entreprises qui n'existent plus.
   */
  const naf = segment.naf.map((code) => `activitePrincipaleEtablissement:${code}`).join(' OR ');
  const query = `codePostalEtablissement:${postalCode} AND periode(etatAdministratifEtablissement:A AND (${naf}))`;

  const url = new URL(API);
  url.searchParams.set('q', query);
  url.searchParams.set('nombre', String(limit));

  const response = await fetch(url, {
    headers: {
      'X-INSEE-Api-Key-Integration': token(),
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (response.status === 404) {
    // Sirene répond 404 quand aucun établissement ne correspond. Ce n'est pas
    // une erreur : c'est un segment vide dans cette commune.
    return [];
  }

  if (!response.ok) {
    // Le code seul ne dit pas pourquoi. Sirene renvoie un corps JSON avec le
    // détail sur les 400 (champ de requête invalide, syntaxe incorrecte…) —
    // sans lui, deviner la cause prend plus de temps que la corriger.
    const body = await response.text().catch(() => '');
    throw new Error(`Sirene a répondu ${response.status} pour ${segment.key} : ${body.slice(0, 400)}`);
  }

  const payload = (await response.json()) as { etablissements?: readonly SireneEtablissement[] };

  return (payload.etablissements ?? [])
    .map((entry): Establishment | null => {
      const name = readName(entry.uniteLegale);
      if (!entry.siret || !name) return null;

      return {
        siret: entry.siret,
        name,
        nafCode:
          entry.periodesEtablissement?.[0]?.activitePrincipaleEtablissement ??
          entry.uniteLegale?.activitePrincipaleUniteLegale ??
          null,
        segment: segment.key,
        address: readAddress(entry.adresseEtablissement),
        postalCode: entry.adresseEtablissement?.codePostalEtablissement ?? null,
        city: entry.adresseEtablissement?.libelleCommuneEtablissement ?? null,
        workforceRange: entry.trancheEffectifsEtablissement ?? null,
      };
    })
    .filter((entry): entry is Establishment => entry !== null);
}

/**
 * Analyse complète d'une zone : tous les segments, un par un.
 *
 * **Séquentiel et non parallèle, délibérément.** Quatre segments lancés
 * ensemble sur plusieurs codes postaux dépassent les 30 requêtes par minute
 * autorisées. Une pause de deux secondes entre deux appels tient largement le
 * quota, et le traitement est de toute façon différé — personne n'attend
 * devant un écran.
 */
export async function scanZone(input: {
  readonly postalCodes: readonly string[];
  readonly perSegment?: number;
}): Promise<{
  readonly establishments: readonly Establishment[];
  readonly errors: readonly string[];
}> {
  const found: Establishment[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const postalCode of input.postalCodes) {
    for (const segment of SEGMENTS) {
      try {
        const batch = await fetchSegment(postalCode, segment, input.perSegment ?? 20);

        for (const item of batch) {
          // Deux codes postaux limitrophes renvoient parfois le même
          // établissement : on ne le compte qu'une fois.
          if (seen.has(item.siret)) continue;
          seen.add(item.siret);
          found.push(item);
        }
      } catch (cause) {
        errors.push(
          `${postalCode}/${segment.key} : ${cause instanceof Error ? cause.message : 'inconnue'}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
  }

  return { establishments: found, errors };
}

/** Répartition par segment, pour le rapport et la colonne `segments`. */
export function countBySegment(
  establishments: readonly Establishment[],
): Record<SegmentKey, number> {
  const counts = Object.fromEntries(SEGMENTS.map((s) => [s.key, 0])) as Record<SegmentKey, number>;
  for (const item of establishments) counts[item.segment] += 1;
  return counts;
}
