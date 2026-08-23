import 'server-only';
import { z } from 'zod';

/**
 * Classement des prospects par pertinence — Hermès.
 *
 * **Ce que fait ce module, et rien de plus.** Un modèle de langage (Mistral)
 * ordonne les entreprises recensées d'une zone selon l'intérêt qu'elles
 * présentent pour l'activité décrite par le professionnel
 * (`hermes_campaigns.activity_description`). Il ne rédige aucun message, ne
 * choisit d'envoyer à personne — ces deux phrases doivent rester vraies pour
 * que « les entreprises sont classées par pertinence à l'aide d'un modèle de
 * langage » reste une description honnête plutôt qu'une promesse d'agent IA
 * (`tests/no-false-promises.test.ts` l'interdit).
 *
 * **Ce qui part vers Mistral : les données publiques du répertoire des
 * entreprises — raison sociale, code d'activité, ville, tranche d'effectif.
 * Jamais l'adresse e-mail, jamais le jeton de désinscription.** Attention :
 * « aucune donnée personnelle » serait faux — pour une entreprise
 * individuelle (fréquent chez les VTC, les petits garages), la raison
 * sociale **est** le nom d'une personne. Le nom part quand même : il est
 * public, nécessaire au classement, et la base légale reste l'intérêt
 * légitime déjà retenue pour toute la prospection (voir
 * `docs/14-hermes-prompt-claude-code.md`). Ce que ce module garantit
 * précisément, c'est que l'adresse e-mail et le jeton de désinscription n'en
 * font jamais partie — voir `ScorableProspect`, dont le type ne porte pas
 * ces deux champs, et le test qui le vérifie.
 *
 * **Un index de lot, jamais l'identifiant `agent_prospects.id`, est envoyé au
 * modèle.** Les entrées du lot sont numérotées 0..N-1 ; la réponse est
 * remappée localement. Deux raisons : aucun identifiant persistant ne sort
 * du système, et un index hors bornes du lot devient trivialement détectable
 * — voir `parseRelevanceResponse`.
 *
 * ## Les trois garde-fous de validation
 *
 * 1. **Score hors [0, 100] ⇒ `null`.** Une hallucination doit coûter un
 *    mauvais classement, jamais la perte d'un prospect.
 * 2. **Index inconnu du lot ⇒ ignoré.**
 * 3. **Entrée manquante dans la réponse ⇒ reste `null`.** Chaque index du lot
 *    est pré-rempli à `null` avant lecture de la réponse ; une réponse
 *    tronquée ou incomplète ne fait donc perdre aucun prospect, seulement son
 *    classement.
 *
 * Un échec total (réseau, HTTP en erreur, JSON illisible, `scores` absent)
 * n'écrit rien du tout — voir `RelevanceScoreResult`. C'est à l'appelant
 * (`/api/agent/relevance`) de laisser `scored_at` vide dans ce cas, pour que
 * le lot soit retenté au passage suivant plutôt que perdu.
 */

/** Tout ce dont le classement a besoin d'un établissement, et rien de plus.
 *  Aucun champ `email` ni jeton de désinscription : structurellement
 *  impossible d'en envoyer un par erreur. `id` sert au remappage local
 *  uniquement — jamais transmis à Mistral, voir `buildRelevancePrompt`. */
export type ScorableProspect = {
  readonly id: string;
  readonly name: string;
  readonly nafCode: string | null;
  readonly city: string | null;
  readonly workforceRange: string | null;
};

/** Entreprises notées par appel : au-delà, un seul appel Mistral risquerait
 *  une réponse tronquée (voir `max_tokens` dans `fetchRelevanceScores`). */
export const RELEVANCE_BATCH_SIZE = 50;

/**
 * Modèle épinglé sur une version datée, pas sur `-latest`.
 *
 * `-latest` est un alias mouvant : Mistral peut le faire pointer vers un
 * autre modèle du jour au lendemain, et un prompt calibré sur une version
 * peut dériver sans qu'aucun test ne le détecte — la sortie reste du JSON
 * valide, respecte le schéma, seulement moins bien classée. Rien dans ce
 * dépôt ne s'en apercevrait.
 *
 * Vérifié le 24/08/2026 sur la documentation publique Mistral
 * (docs.mistral.ai/models/model-cards/mistral-small-4-0-26-03) : identifiant
 * d'appel `mistral-small-2603`, recoupé avec le format des versions
 * dépréciées listées par ailleurs (`mistral-small-2506`, `-2503`, `-2501`,
 * `-2409` — même format AAMM) et avec l'identifiant qu'utilise OpenRouter
 * pour le même modèle (`mistralai/mistral-small-2603`). Vérifié via un outil
 * qui résume la page plutôt qu'un accès direct au HTML — pas une garantie
 * absolue, à confirmer par un appel réel une fois une clé disponible. Si le
 * classement se dégrade sans qu'aucune ligne de ce fichier n'ait changé,
 * vérifier ici en premier : soit ce modèle a été retiré, soit une version
 * plus récente est sortie et celle-ci est restée figée sur l'ancienne.
 */
const MISTRAL_MODEL = 'mistral-small-2603';

const SYSTEM_PROMPT =
  "Tu classes des établissements par pertinence commerciale pour un professionnel, à partir d'une phrase décrivant son activité. Un score élevé (proche de 100) signifie que l'établissement est un client ou partenaire probable ; un score faible (proche de 0) signifie qu'il n'a probablement aucun rapport avec cette activité. N'invente aucune information sur les établissements au-delà de ce qui t'est fourni. Réponds pour chaque établissement de la liste, en reprenant son champ « index » exactement tel que fourni — jamais son nom, jamais un autre identifiant.";

/** Schéma JSON strict envoyé à Mistral (`response_format`). Contraint le
 *  décodage du modèle, mais ne dispense pas de revalider côté serveur — voir
 *  `parseRelevanceResponse`. */
const RELEVANCE_JSON_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'relevance_scores',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        scores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'integer' },
              score: { type: 'integer', minimum: 0, maximum: 100 },
            },
            required: ['index', 'score'],
            additionalProperties: false,
          },
        },
      },
      required: ['scores'],
      additionalProperties: false,
    },
  },
} as const;

/**
 * Construit les deux messages envoyés à Mistral.
 *
 * Fonction pure : aucun réseau, aucune base. Les entrées du lot sont
 * numérotées par leur position dans `prospects` (0..N-1) — c'est cet index,
 * et lui seul, que la réponse doit reprendre.
 */
export function buildRelevancePrompt(input: {
  readonly activityDescription: string;
  readonly prospects: readonly ScorableProspect[];
}): { readonly system: string; readonly user: string } {
  const items = input.prospects.map((prospect, index) => ({
    index,
    name: prospect.name,
    naf: prospect.nafCode,
    city: prospect.city,
    workforce: prospect.workforceRange,
  }));

  return {
    system: SYSTEM_PROMPT,
    user: `Activité du professionnel : ${input.activityDescription}\n\nÉtablissements à classer :\n${JSON.stringify(items)}`,
  };
}

export type RelevanceScoreResult =
  | { readonly ok: true; readonly scoresByIndex: ReadonlyMap<number, number | null> }
  | { readonly ok: false };

const responseEnvelopeSchema = z.object({ scores: z.array(z.unknown()) });
const responseItemSchema = z.object({ index: z.number(), score: z.number() });

/**
 * Valide et interprète la réponse brute de Mistral.
 *
 * Fonction pure : ne fait confiance ni à la présence d'aucun champ, ni au
 * respect du schéma envoyé — `strict: true` réduit le risque, ne le supprime
 * pas. Implémente les trois garde-fous décrits en en-tête de fichier.
 */
export function parseRelevanceResponse(raw: string, batchSize: number): RelevanceScoreResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false };
  }

  const envelope = responseEnvelopeSchema.safeParse(parsed);
  if (!envelope.success) return { ok: false };

  // Chaque index du lot est pré-rempli à `null` : une réponse tronquée ou
  // incomplète ne fait perdre aucun prospect, seulement son classement.
  const scoresByIndex = new Map<number, number | null>();
  for (let index = 0; index < batchSize; index += 1) scoresByIndex.set(index, null);

  for (const rawItem of envelope.data.scores) {
    const item = responseItemSchema.safeParse(rawItem);
    if (!item.success) continue; // entrée illisible : ignorée, comme un index inconnu

    const { index, score } = item.data;
    if (!Number.isInteger(index) || index < 0 || index >= batchSize) continue; // index inconnu du lot
    if (!Number.isInteger(score) || score < 0 || score > 100) continue; // score hors [0,100] : reste null

    scoresByIndex.set(index, score);
  }

  return { ok: true, scoresByIndex };
}

/**
 * Appelle Mistral pour un lot, et renvoie le résultat déjà validé.
 *
 * Fonction fine, isolée : c'est le seul endroit de ce module qui touche le
 * réseau, vérifiée par lecture de code plutôt que par exécution (comme
 * `attemptReportSend` dans `agent/process/route.ts`). `{ ok: false }` couvre
 * uniformément l'absence de configuration, l'échec réseau, une réponse HTTP
 * en erreur et un corps illisible — dans tous les cas, l'appelant n'écrit
 * rien et laisse le lot au passage suivant.
 */
export async function fetchRelevanceScores(input: {
  readonly activityDescription: string;
  readonly prospects: readonly ScorableProspect[];
}): Promise<RelevanceScoreResult> {
  if (input.prospects.length === 0) return { ok: true, scoresByIndex: new Map() };

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return { ok: false };

  const { system, user } = buildRelevancePrompt(input);

  let response: Response;
  try {
    response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        temperature: 0,
        max_tokens: 2000,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: RELEVANCE_JSON_SCHEMA,
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return { ok: false };
  }

  if (!response.ok) return { ok: false };

  const body = (await response.json().catch(() => null)) as
    | { readonly choices?: readonly { readonly message?: { readonly content?: string } }[] }
    | null;
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') return { ok: false };

  return parseRelevanceResponse(content, input.prospects.length);
}
