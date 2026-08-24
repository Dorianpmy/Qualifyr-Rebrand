import 'server-only';
import { z } from 'zod';

import type { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import { isUsableEmail } from './osm-enrich';

/**
 * Hermès — listes de prospects importées par le professionnel.
 *
 * **Pourquoi ce module existe.** Le recensement automatique ne couvre que la
 * France (Sirene), et seulement deux segments sur quatre par OpenStreetMap
 * (`osm-enrich.ts`) : ni VTC, ni flottes, ni la Suisse. Un professionnel qui
 * connaît déjà les entreprises de sa région — ce qui est fréquent pour les
 * flottes et les transporteurs — doit pouvoir les apporter lui-même.
 *
 * **Le renversement de responsabilité est réel, pas contractuel.** Sur une
 * liste importée, Qualifyr n'a jamais collecté l'adresse : le professionnel
 * est responsable du traitement, Qualifyr sous-traitant — exactement le
 * partage que décrit l'article 28 des CGV. `IMPORT_ATTESTATION_TEXT` est ce
 * qui rend cette responsabilité vérifiable après coup, et non une simple
 * clause qu'on invoque.
 *
 * **Deux tables, deux régimes de suppression.** Voir le commentaire d'en-tête
 * de la migration 022 : les adresses sont effaçables à la demande,
 * l'attestation ne l'est jamais. Ce module n'expose donc aucune fonction de
 * suppression d'attestation — l'absence est délibérée, pas un oubli.
 *
 * **Pas de téléphone.** Hermès n'appelle personne sur une liste importée : le
 * rapport de secteur qui justifie de collecter le téléphone (voir
 * `osm-enrich.ts`) ne concerne que les prospects recensés.
 */

/**
 * Texte exact de l'attestation, écrit par le serveur et jamais reçu du
 * client — même principe que `terms_accepted_at` dans
 * `api/app/hermes/route.ts` : une valeur venue du navigateur pourrait être
 * différente de ce qui est réellement affiché, et c'est précisément la trace
 * qui établit qui est responsable de quoi en cas de réclamation. Le client
 * envoie seulement `attestationAccepted: true` ; ce module écrit ce texte-ci.
 *
 * Trois affirmations distinctes, chacune vaut par ce qu'elle engage :
 * légalité de l'obtention, nature B2B des adresses, responsabilité des
 * réclamations sur leur origine.
 */
export const IMPORT_ATTESTATION_TEXT =
  "En important cette liste, je certifie que :\n" +
  "1. J'ai obtenu ces adresses par un moyen licite et je suis en mesure d'en justifier l'origine sur demande.\n" +
  '2. Elles concernent des entreprises, jamais des particuliers agissant en dehors de leur activité professionnelle.\n' +
  "3. Je reste seul responsable, en tant que responsable du traitement, de toute réclamation portant sur l'origine de ces adresses ; Qualifyr n'intervient que comme sous-traitant, sur mes instructions, exactement comme le décrit l'article 28 des CGV.";

/** Une seule ligne d'import, au plus grand : au-delà, la validation et le
 *  rapport de rejets doivent rester instantanés. Voir le plan validé :
 *  une liste de connaissance personnelle tient largement dans cette taille,
 *  un fichier acheté non. */
export const MAX_IMPORT_SIZE = 500;

/** Total de prospects importés conservés par compte, tous imports cumulés,
 *  lignes opposées comprises (les retirer permettrait de recharger
 *  indéfiniment par cycles). Au quota quotidien maximal (40,
 *  `hermes_campaigns.daily_quota`), cinquante jours de marge — généreux pour
 *  un usage réel, à deux ordres de grandeur d'une liste achetée. */
export const MAX_TOTAL_IMPORTED_PROSPECTS = 2_000;

export type ImportRow = { readonly line: number; readonly name: string; readonly email: string };
export type RejectedLine = { readonly line: number; readonly raw: string; readonly reason: string };

const NAME_MAX_LENGTH = 200;
const emailShape = z.email();

/** `nom,e-mail` ou `nom;e-mail` — un séparateur unique, pas de format riche à
 *  documenter ni à faire échouer silencieusement sur une virgule dans un nom. */
function parseLine(raw: string): { readonly name: string; readonly email: string } | null {
  const parts = raw.split(/[,;]/).map((part) => part.trim());
  if (parts.length < 2) return null;
  const [name, email] = parts;
  if (!name || !email) return null;
  return { name, email };
}

/**
 * Valide un import ligne par ligne. Fonction pure : ni réseau ni base, donc
 * testable avec de vrais cas, et réutilisable pour un aperçu côté client
 * avant l'envoi.
 *
 * **Rien n'est tronqué en silence.** Chaque ligne rejetée porte son numéro et
 * la raison exacte — un import qui écarterait des lignes sans le dire
 * laisserait croire au professionnel que des messages partiront à des
 * adresses qui n'ont jamais été enregistrées.
 *
 * Le dédoublonnage **dans le lot** se fait ici ; le dédoublonnage contre les
 * adresses déjà en base pour ce compte se fait dans `importProspects`, qui
 * seul a accès à la base.
 */
export function validateImportText(raw: string): {
  readonly accepted: readonly ImportRow[];
  readonly rejected: readonly RejectedLine[];
} {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const accepted: ImportRow[] = [];
  const rejected: RejectedLine[] = [];
  const seenInBatch = new Set<string>();

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const parsed = parseLine(line);

    if (!parsed) {
      rejected.push({ line: lineNumber, raw: line, reason: 'format attendu : nom, e-mail' });
      return;
    }

    const { name, email } = parsed;

    if (name.length === 0 || name.length > NAME_MAX_LENGTH) {
      rejected.push({ line: lineNumber, raw: line, reason: 'nom manquant ou trop long' });
      return;
    }

    if (!emailShape.safeParse(email).success) {
      rejected.push({ line: lineNumber, raw: line, reason: 'adresse mal formée' });
      return;
    }

    if (!isUsableEmail(email)) {
      rejected.push({ line: lineNumber, raw: line, reason: 'adresse technique non exploitable' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (seenInBatch.has(normalizedEmail)) {
      rejected.push({ line: lineNumber, raw: line, reason: 'doublon dans cet import' });
      return;
    }
    seenInBatch.add(normalizedEmail);

    accepted.push({ line: lineNumber, name, email: normalizedEmail });
  });

  return { accepted, rejected };
}

export type ImportOutcome =
  | { readonly ok: true; readonly imported: number; readonly rejected: readonly RejectedLine[] }
  | { readonly ok: false; readonly reason: string };

type Supabase = NonNullable<ReturnType<typeof getServiceSupabaseClient>>;

/**
 * Valide, plafonne, dédoublonne contre la base, puis écrit l'attestation et
 * les adresses.
 *
 * **L'attestation est écrite avant les adresses, dans le même passage, et
 * seulement s'il reste au moins une adresse à insérer.** Une attestation sans
 * aucune adresse associée ne prouverait rien de vérifiable ; mieux vaut ne
 * pas l'écrire que d'en accumuler une par tentative infructueuse.
 *
 * **Les deux plafonds sont vérifiés avant d'écrire quoi que ce soit** — même
 * raisonnement que le commentaire d'en-tête de `api/app/hermes/route.ts` sur
 * le quota : la barrière qui compte est côté serveur, jamais l'interface.
 */
export async function importProspects(
  supabase: Supabase,
  ownerId: string,
  rawText: string,
): Promise<ImportOutcome> {
  const { accepted, rejected } = validateImportText(rawText);

  if (accepted.length === 0 && rejected.length === 0) {
    return { ok: false, reason: 'La liste est vide.' };
  }

  if (accepted.length + rejected.length > MAX_IMPORT_SIZE) {
    return { ok: false, reason: `Un import est limité à ${MAX_IMPORT_SIZE} adresses.` };
  }

  const { count: existingCount, error: countError } = await supabase
    .from('agent_imported_prospects')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId);

  // Vérification impossible ⇒ on n'écrit rien, même principe que les
  // vérifications d'Hermès avant l'envoi (`isSuppressed`, `remainingQuota`).
  if (countError) return { ok: false, reason: 'Vérification du plafond impossible. Réessayez.' };

  const { data: existingEmails, error: existingError } = await supabase
    .from('agent_imported_prospects')
    .select('email')
    .eq('owner_id', ownerId);

  if (existingError) return { ok: false, reason: 'Vérification des doublons impossible. Réessayez.' };

  const existingSet = new Set((existingEmails ?? []).map((row) => (row.email as string).toLowerCase()));

  const rejectedAll: RejectedLine[] = [...rejected];
  const toInsert = accepted.filter((row) => {
    if (existingSet.has(row.email)) {
      rejectedAll.push({ line: row.line, raw: `${row.name}, ${row.email}`, reason: 'déjà importé pour ce compte' });
      return false;
    }
    return true;
  });

  if ((existingCount ?? 0) + toInsert.length > MAX_TOTAL_IMPORTED_PROSPECTS) {
    return {
      ok: false,
      reason: `Ce compte a atteint le plafond de ${MAX_TOTAL_IMPORTED_PROSPECTS} prospects importés. Supprimez d’anciennes adresses avant d’en ajouter.`,
    };
  }

  if (toInsert.length === 0) {
    return { ok: true, imported: 0, rejected: rejectedAll };
  }

  const { data: attestation, error: attestationError } = await supabase
    .from('agent_import_attestations')
    .insert({ owner_id: ownerId, statement_text: IMPORT_ATTESTATION_TEXT, row_count: toInsert.length })
    .select('id')
    .single();

  if (attestationError || !attestation) {
    return { ok: false, reason: 'Enregistrement de l’attestation impossible. Réessayez.' };
  }

  const { error: insertError } = await supabase.from('agent_imported_prospects').insert(
    toInsert.map((row) => ({
      owner_id: ownerId,
      attestation_id: attestation.id as string,
      name: row.name,
      email: row.email,
    })),
  );

  if (insertError) {
    return { ok: false, reason: 'Enregistrement des adresses impossible. Réessayez.' };
  }

  return { ok: true, imported: toInsert.length, rejected: rejectedAll };
}

export type ImportedProspectRow = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly contactedAt: string | null;
  readonly optedOutAt: string | null;
  readonly createdAt: string;
};

/** La liste complète pour consultation — bornée par `MAX_TOTAL_IMPORTED_PROSPECTS`
 *  de toute façon, un compte ne peut jamais en porter davantage. */
export async function listImportedProspects(
  supabase: Supabase,
  ownerId: string,
): Promise<readonly ImportedProspectRow[]> {
  const { data, error } = await supabase
    .from('agent_imported_prospects')
    .select('id, name, email, contacted_at, opted_out_at, created_at')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(MAX_TOTAL_IMPORTED_PROSPECTS);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    contactedAt: row.contacted_at as string | null,
    optedOutAt: row.opted_out_at as string | null,
    createdAt: row.created_at as string,
  }));
}

/** Combien de prospects importés ce compte peut-il encore contacter — même
 *  périmètre que ce que `nextCandidates` retiendra réellement. */
export async function countContactableImportedProspects(
  supabase: Supabase,
  ownerId: string,
): Promise<number> {
  const { count } = await supabase
    .from('agent_imported_prospects')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
    .is('contacted_at', null)
    .is('opted_out_at', null);

  return count ?? 0;
}

/**
 * Supprime une adresse importée. Ne touche jamais
 * `agent_import_attestations` — voir le commentaire d'en-tête de ce fichier
 * et de la migration 022. `owner_id` est vérifié dans la clause `eq`, jamais
 * seulement dans l'appelant : sans elle, connaître l'UUID d'une ligne d'un
 * tiers suffirait à la supprimer.
 */
export async function deleteImportedProspect(
  supabase: Supabase,
  ownerId: string,
  prospectId: string,
): Promise<boolean> {
  const { error, count } = await supabase
    .from('agent_imported_prospects')
    .delete({ count: 'exact' })
    .eq('id', prospectId)
    .eq('owner_id', ownerId);

  return !error && (count ?? 0) > 0;
}

/** Supprime la liste entière du compte. Même garantie que ci-dessus sur
 *  `agent_import_attestations`. */
export async function deleteAllImportedProspects(supabase: Supabase, ownerId: string): Promise<boolean> {
  const { error } = await supabase.from('agent_imported_prospects').delete().eq('owner_id', ownerId);
  return !error;
}
