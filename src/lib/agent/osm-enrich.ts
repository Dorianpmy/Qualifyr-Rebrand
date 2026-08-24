import 'server-only';

import type { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import type { SegmentKey } from './sirene';

/**
 * Hermès — enrichissement e-mail/téléphone par OpenStreetMap.
 *
 * **Pourquoi OpenStreetMap.** `agent_prospects.email` n'a jamais été
 * renseigné : Sirene recense des établissements, pas des annuaires de
 * contact. OpenStreetMap, gratuit et sans clé, porte parfois directement
 * l'e-mail et le téléphone d'un commerce ; sinon il porte son site, sur
 * lequel Qualifyr peut aller chercher une adresse.
 *
 * **Deux segments seulement, et c'est délibéré.** VTC (taxi ≠ VTC en droit
 * français, mauvais tag) et flottes (sièges d'entreprise, pas des commerces
 * qu'on visite, aucun tag OSM fiable) restent à 0 % par cette voie — ce n'est
 * pas un défaut du rapprochement, c'est une limite de la source. Voir
 * `OSM_ENRICHABLE_SEGMENTS`.
 *
 * **Ce fichier ne sait pas s'il enrichit un prospect Sirene existant (France,
 * aujourd'hui) ou s'il constitue directement une liste d'établissements
 * (Suisse, hypothèse future, non implémentée ici).** `fetchOsmEstablishments`
 * est écrite pour servir les deux usages sans modification — c'est
 * l'appelant qui décide de ce qu'il fait des résultats.
 *
 * **Le fetch de site tiers est le seul endroit de ce module qui sort vers un
 * hôte non maîtrisé.** Timeout court, taille de réponse plafonnée,
 * `http`/`https` uniquement, aucune redirection suivie hors du domaine
 * d'origine, aucune exception qui remonte — voir `fetchWebsiteEmail`.
 */

/**
 * Segments Sirene pour lesquels un tag OpenStreetMap fait sens. `vtc` et
 * `flottes` en sont absents : voir l'en-tête de fichier.
 */
export const OSM_ENRICHABLE_SEGMENTS: readonly SegmentKey[] = ['concessions', 'loueurs'];

type OsmTagFilter = { readonly osmKey: string; readonly osmValues: readonly string[] };

/**
 * Correspondance segment Sirene → tag OpenStreetMap.
 *
 * **Une approximation, pas une traduction.** Un tag OSM décrit un lieu tel
 * qu'un contributeur l'a cartographié ; un code NAF décrit une activité
 * déclarée à l'administration. Les deux ne se recouvrent jamais parfaitement
 * — une concession taguée `shop=car` peut très bien être enregistrée sous un
 * NAF de négoce plutôt que de réparation, par exemple. Cette table reste
 * volontairement la seule à encoder ce rapprochement, pour n'avoir qu'un
 * endroit à corriger si l'expérience montre qu'il est mauvais.
 */
export const SEGMENT_OSM_TAGS: Partial<Record<SegmentKey, OsmTagFilter>> = {
  concessions: { osmKey: 'shop', osmValues: ['car_repair', 'car'] },
  loueurs: { osmKey: 'amenity', osmValues: ['car_rental'] },
};

/**
 * Rectangle fixe couvrant la France métropolitaine et la Suisse.
 *
 * Overpass n'exige pas de boîte englobante pour une requête filtrée sur un
 * tag sélectif comme `addr:postcode`, mais en fournir une évite un balayage
 * planétaire sans exiger de géocodage par zone — on ne dispose que d'un code
 * postal, pas de coordonnées. Fixe plutôt que calculée par zone : elle couvre
 * déjà l'intégralité de la Suisse, utile sans changement si un recensement
 * suisse s'appuie un jour sur ce même module.
 */
const EUROPE_BBOX = '41.2,-5.3,51.3,10.6';

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

/** Overpass demande un user-agent identifiable — règle de politesse d'usage
 *  de l'instance publique, pas une clé d'authentification. */
const USER_AGENT = 'Qualifyr-Hermes/1.0 (+https://qualifyragence.com)';

function escapeRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Construit la requête Overpass QL.
 *
 * Fonction pure : aucun réseau. **Une seule requête couvre tous les codes
 * postaux et tous les segments demandés** — c'est ce qui garantit « une
 * requête par zone, jamais par entreprise » côté appelant.
 */
export function buildOverpassQuery(input: {
  readonly postalCodes: readonly string[];
  readonly segments: readonly SegmentKey[];
}): string {
  const postcodePattern = input.postalCodes.map(escapeRegexLiteral).join('|');

  const clauses = input.segments
    .map((segment) => SEGMENT_OSM_TAGS[segment])
    .filter((tags): tags is OsmTagFilter => tags !== undefined)
    .map((tags) => {
      const valuePattern = tags.osmValues.map(escapeRegexLiteral).join('|');
      return `  nwr["addr:postcode"~"^(${postcodePattern})$"]["${tags.osmKey}"~"^(${valuePattern})$"];`;
    })
    .join('\n');

  // [timeout:20] : aligné sur le délai côté client (voir fetchOsmEstablishments)
  // pour qu'Overpass n'annonce jamais un budget que la connexion ne tient pas.
  return `[out:json][timeout:20][bbox:${EUROPE_BBOX}];\n(\n${clauses}\n);\nout tags;`;
}

/** Ce qu'un établissement OpenStreetMap peut porter comme coordonnées. Aucun
 *  identifiant OSM n'est conservé : le rapprochement se fait sur le nom, une
 *  fois, dans le passage qui a fait la requête — rien n'est persisté côté
 *  OSM au-delà du résultat du rapprochement. */
export type OsmFeature = {
  readonly name: string;
  /** Segment Sirene déduit du tag qui a fait matcher l'élément — voir
   *  `SEGMENT_OSM_TAGS`. Sert à ne jamais comparer un prospect `loueurs` à un
   *  établissement tagué `shop=car_repair`, et inversement. */
  readonly segment: SegmentKey;
  readonly email: string | null;
  readonly website: string | null;
  readonly phone: string | null;
};

/** Le segment Sirene dont les tags OSM correspondent à cet élément, ou
 *  `null` si aucun des segments demandés ne correspond (ne devrait pas
 *  arriver : la requête elle-même est construite à partir des mêmes tags). */
function matchSegment(
  tags: Record<string, string> | undefined,
  segments: readonly SegmentKey[],
): SegmentKey | null {
  if (!tags) return null;
  for (const segment of segments) {
    const filter = SEGMENT_OSM_TAGS[segment];
    if (!filter) continue;
    const value = tags[filter.osmKey];
    if (value && filter.osmValues.includes(value)) return segment;
  }
  return null;
}

export type OsmFetchResult =
  | { readonly ok: true; readonly features: readonly OsmFeature[] }
  | { readonly ok: false };

function readTag(tags: Record<string, string> | undefined, keys: readonly string[]): string | null {
  if (!tags) return null;
  for (const key of keys) {
    const value = tags[key]?.trim();
    if (value) return value;
  }
  return null;
}

/**
 * Un seul appel Overpass. Échec réseau, HTTP en erreur ou JSON illisible :
 * `{ ok: false }` uniformément — à l'appelant de ne rien écrire et de
 * laisser la zone attendre le passage suivant, même principe que
 * `fetchRelevanceScores` (`lib/agent/relevance.ts`).
 */
export async function fetchOsmEstablishments(input: {
  readonly postalCodes: readonly string[];
  readonly segments: readonly SegmentKey[];
}): Promise<OsmFetchResult> {
  const query = buildOverpassQuery(input);

  let response: Response;
  try {
    response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
      // Le budget de `/api/agent/enrich` (60 s) est calculé en tenant compte
      // de ce plafond — voir le commentaire d'en-tête de cette route.
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return { ok: false };
  }

  if (!response.ok) return { ok: false };

  const body = (await response.json().catch(() => null)) as
    | { readonly elements?: readonly { readonly tags?: Record<string, string> }[] }
    | null;
  const elements = body?.elements;
  if (!Array.isArray(elements)) return { ok: false };

  const features: OsmFeature[] = [];
  for (const element of elements) {
    const tags = element.tags;
    const name = tags?.name?.trim();
    if (!name) continue; // sans nom, aucun rapprochement possible

    const segment = matchSegment(tags, input.segments);
    if (!segment) continue; // ne devrait pas arriver, voir matchSegment

    features.push({
      name,
      segment,
      email: readTag(tags, ['email', 'contact:email']),
      website: readTag(tags, ['website', 'contact:website', 'url']),
      phone: readTag(tags, ['phone', 'contact:phone']),
    });
  }

  return { ok: true, features };
}

/* ------------------------------------------------------------------ */
/* Extraction sur le site — la source secondaire                       */
/* ------------------------------------------------------------------ */

/** Le budget de `/api/agent/enrich` (60 s) est calculé à partir de ce
 *  plafond — voir le commentaire d'en-tête de cette route. */
const FETCH_TIMEOUT_MS = 4_000;
/** Octets lus au maximum par page, indépendamment de `Content-Length` (qui
 *  peut mentir ou manquer) : la lecture du flux s'arrête d'elle-même. */
const MAX_BODY_BYTES = 300_000;
/** Un seul saut de redirection suivi, et seulement vers le même hôte. */
const MAX_REDIRECT_HOPS = 1;

function isHttpUrl(url: URL): boolean {
  return url.protocol === 'http:' || url.protocol === 'https:';
}

async function readBounded(body: ReadableStream<Uint8Array>): Promise<string | null> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      chunks.push(value);
      if (total > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        break; // on garde ce qui a déjà été lu, tronqué au plafond
      }
    }
  } catch {
    // Flux interrompu (timeout, connexion coupée) : on travaille avec ce qui
    // a déjà été reçu plutôt que de tout perdre.
  }

  if (chunks.length === 0) return null;
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('utf-8');
}

/**
 * Récupère le HTML d'une page, sous contrainte.
 *
 * Renvoie toujours soit un résultat exploitable, soit `null` — jamais une
 * exception. C'est la fonction qui porte toutes les garanties réseau du
 * module.
 */
async function safeFetchHtml(rawUrl: string): Promise<{ readonly html: string; readonly finalUrl: URL } | null> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!isHttpUrl(url)) return null;

  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { 'User-Agent': USER_AGENT },
      });
    } catch {
      return null;
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return null;

      let next: URL;
      try {
        next = new URL(location, url);
      } catch {
        return null;
      }
      // Jamais de redirection suivie hors du domaine d'origine.
      if (next.hostname !== url.hostname || !isHttpUrl(next)) return null;

      url = next;
      continue;
    }

    if (!response.ok || !response.body) return null;

    const html = await readBounded(response.body);
    if (html === null) return null;
    return { html, finalUrl: url };
  }

  return null; // trop de sauts de redirection
}

const MAILTO_PATTERN = /mailto:([^"'\s?]+)/gi;
const PLAIN_EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/**
 * Adresses trouvées dans du HTML brut, `mailto:` en priorité.
 *
 * Fonction pure. Ne filtre rien : `isUsableEmail` fait ce tri, séparément,
 * pour rester testable indépendamment.
 */
export function extractEmailsFromHtml(html: string): readonly string[] {
  const found = new Set<string>();
  for (const match of html.matchAll(MAILTO_PATTERN)) {
    const email = match[1]?.toLowerCase();
    if (email) found.add(email);
  }
  for (const match of html.matchAll(PLAIN_EMAIL_PATTERN)) {
    found.add(match[0].toLowerCase());
  }
  return Array.from(found);
}

const CONTACT_LINK_PATTERN = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Un lien vers une page de contact, sur la même origine que `baseUrl`.
 *
 * Fonction pure. Un seul lien retenu, le premier qui correspond — pas
 * davantage : suivre plusieurs candidats multiplierait les fetches pour un
 * gain marginal.
 */
export function findContactLink(html: string, baseUrl: string): string | null {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return null;
  }

  for (const match of html.matchAll(CONTACT_LINK_PATTERN)) {
    const href = match[1] ?? '';
    const label = (match[2] ?? '').replace(/<[^>]+>/g, '');
    if (!/contact/i.test(href) && !/contact/i.test(label)) continue;

    let candidate: URL;
    try {
      candidate = new URL(href, base);
    } catch {
      continue;
    }
    if (candidate.hostname !== base.hostname || !isHttpUrl(candidate)) continue;

    return candidate.toString();
  }

  return null;
}

/**
 * Domaines qui apparaissent dans le HTML d'un site par artefact technique
 * (générateur de site, suivi d'erreur, protection WHOIS), jamais comme
 * adresse de contact réelle de l'entreprise qui possède le site.
 *
 * Liste amorcée avec des cas documentés, pas prétendument exhaustive : à
 * enrichir avec de vrais cas observés une fois ce mécanisme en production.
 */
const DENYLISTED_EMAIL_DOMAINS = [
  'sentry.io', // suivi d'erreur, injecté côté client par le SDK
  'wixpress.com', // adresse technique insérée par le générateur Wix
  'godaddy.com',
  'domainsbyproxy.com', // protection WHOIS générique
  'example.com',
  'example.org',
  'example.net', // RFC 2606, domaines réservés
] as const;

/** Préfixes qui désignent une boîte technique, jamais un interlocuteur. */
const DENYLISTED_LOCAL_PARTS = ['no-reply', 'noreply', 'donotreply', 'postmaster', 'abuse'] as const;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** L'adresse a-t-elle une forme exploitable, hors liste noire ? Fonction pure. */
export function isUsableEmail(email: string): boolean {
  if (!EMAIL_SHAPE.test(email)) return false;

  const [localPart, domain] = email.toLowerCase().split('@');
  if (!localPart || !domain) return false;
  if ((DENYLISTED_LOCAL_PARTS as readonly string[]).includes(localPart)) return false;

  return !(DENYLISTED_EMAIL_DOMAINS as readonly string[]).some(
    (denied) => domain === denied || domain.endsWith(`.${denied}`),
  );
}

/**
 * Cherche un e-mail exploitable sur le site d'un établissement.
 *
 * Page d'accueil d'abord ; si rien n'y est trouvé, une page de contact sur la
 * même origine, au maximum une. Deux fetches par prospect au pire, jamais
 * plus. Toute défaillance (réseau, HTML illisible, absence de résultat)
 * renvoie `null` — jamais d'exception.
 */
export async function fetchWebsiteEmail(websiteUrl: string): Promise<string | null> {
  const home = await safeFetchHtml(websiteUrl);
  if (!home) return null;

  const fromHome = extractEmailsFromHtml(home.html).find(isUsableEmail);
  if (fromHome) return fromHome;

  const contactUrl = findContactLink(home.html, home.finalUrl.toString());
  if (!contactUrl) return null;

  const contact = await safeFetchHtml(contactUrl);
  if (!contact) return null;

  return extractEmailsFromHtml(contact.html).find(isUsableEmail) ?? null;
}

/* ------------------------------------------------------------------ */
/* Adresse partagée par de nombreux établissements                     */
/* ------------------------------------------------------------------ */

/**
 * Au-delà de cette dizaine d'établissements distincts (par SIRET) déjà
 * porteurs de la même adresse, ce n'est plus une franchise ou un groupe
 * plausible : c'est un artefact de gabarit (thème, agence web dont l'adresse
 * traîne en pied de page). Entre un et dix, l'adresse reste attribuée — le
 * dédoublonnage à l'envoi (`nextCandidates`, `lib/agent/outreach.ts`) est ce
 * qui évite d'écrire plusieurs fois à la même boîte, pas ce filtre-ci.
 */
export const MAX_SHARED_EMAIL_ATTRIBUTIONS = 10;

/**
 * Cette adresse est-elle déjà portée par au moins `MAX_SHARED_EMAIL_ATTRIBUTIONS`
 * prospects distincts ?
 *
 * **Vérification impossible ⇒ on n'attribue pas**, même principe que
 * `isSuppressed` (`lib/agent/outreach.ts`) : une lecture ratée ne doit jamais
 * ouvrir la voie à une attribution qu'on n'a pas pu vérifier.
 */
export async function isEmailOverAttributed(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  email: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('agent_prospects')
    .select('siret')
    .eq('email', email.trim().toLowerCase())
    .not('siret', 'is', null);

  if (error) return true;

  const distinctSirets = new Set((data ?? []).map((row) => row.siret as string));
  return distinctSirets.size >= MAX_SHARED_EMAIL_ATTRIBUTIONS;
}
