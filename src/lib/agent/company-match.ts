/**
 * Rapprochement de raisons sociales — Sirene contre OpenStreetMap.
 *
 * **Fonction pure, sans réseau ni base**, comme `outreach-message.ts` et
 * `report-retry.ts` : c'est ce qui la rend testable avec de vrais couples de
 * noms plutôt que par lecture de code.
 *
 * **Le doute tranche contre le rapprochement, jamais pour.** Un e-mail
 * attribué à la mauvaise entreprise, c'est un message envoyé à quelqu'un qui
 * n'a rien demandé sous un nom qui n'est pas le sien — pire qu'un prospect
 * sans e-mail du tout.
 *
 * **Limite connue, documentée plutôt que cachée.** Beaucoup de concessions et
 * garages sont tagués sur OpenStreetMap par leur enseigne (« Norauto »,
 * « Speedy », « Renault ») et non par la raison sociale exacte du franchisé
 * enregistrée au Sirene. Cet algorithme rejette correctement ces cas par
 * prudence — une perte de *rappel* (des correspondances réelles manquées),
 * jamais de *précision* (pas de faux rapprochement). C'est le compromis
 * voulu, et il pèse directement sur le taux de correspondance réel.
 */

/**
 * Formes juridiques françaises, retirées en tant que mots entiers.
 *
 * En sous-chaîne, « sa » couperait la fin de « Garage Lisa » — d'où le filtre
 * sur des tokens déjà découpés par espace dans `normalizeCompanyName`, jamais
 * un remplacement par sous-chaîne.
 */
const LEGAL_FORM_TOKENS = [
  'sarl',
  'sas',
  'sasu',
  'sa',
  'eurl',
  'sci',
  'eirl',
  'snc',
  'ets',
  'etablissements',
  'societe',
  'ste',
] as const;

/**
 * Mots du secteur trop génériques pour compter comme preuve de
 * correspondance : « Garage Auto Services » ne doit matcher personne sur
 * ces seuls mots.
 */
const GENERIC_SECTOR_WORDS = [
  'garage',
  'auto',
  'automobile',
  'automobiles',
  'service',
  'services',
  'centre',
  'center',
  'atelier',
  'groupe',
  'group',
] as const;

/** Mots outils, sans valeur distinctive. */
const STOPWORDS = ['et', 'de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'au', 'aux'] as const;

/** Retire les diacritiques (é → e) sans dépendance externe. */
function stripAccents(value: string): string {
  // Plage Unicode des signes diacritiques combinants (U+0300-U+036F), une
  // fois la chaîne décomposée par `normalize('NFD')` — écrite en échappement
  // plutôt qu'en caractères littéraux, illisibles dans un diff.
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Casse, accents, formes juridiques et ponctuation neutralisées.
 *
 * Exporté : la normalisation seule est déjà utile à l'appelant pour détecter
 * une égalité stricte avant même de calculer une similarité.
 */
export function normalizeCompanyName(raw: string): string {
  const base = stripAccents(raw.toLowerCase())
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const withoutLegalForm = base.filter(
    (word) => !(LEGAL_FORM_TOKENS as readonly string[]).includes(word),
  );

  return withoutLegalForm.join(' ').trim();
}

/**
 * Tokens qui comptent comme preuve de correspondance : ni mot outil, ni mot
 * générique du secteur, ni trop court pour être distinctif.
 */
export function meaningfulTokens(normalized: string): readonly string[] {
  const excluded: readonly string[] = [...GENERIC_SECTOR_WORDS, ...STOPWORDS];
  return normalized
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !excluded.includes(word));
}

/** Coefficient de Dice sur deux ensembles de tokens (0..1). */
function diceCoefficient(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const token of setA) if (setB.has(token)) intersection += 1;
  return (2 * intersection) / (setA.size + setB.size);
}

/** En dessous, on ne rapproche pas — voir l'en-tête de fichier. */
const DICE_THRESHOLD = 0.75;

/**
 * Les deux noms désignent-ils, avec confiance, le même établissement ?
 *
 * Trois règles, dans cet ordre ; la première qui s'applique décide :
 *
 * 1. Chaînes normalisées identiques → correspondance.
 * 2. Coefficient de Dice sur les tokens significatifs ≥ 0,75 → correspondance.
 * 3. Tous les tokens significatifs du nom le plus court contenus dans le plus
 *    long, et au moins un token d'au moins 3 caractères → correspondance
 *    (couvre « Garage Martin » face à « Garage Martin Carrosserie Peinture »,
 *    que Dice seul rejetterait).
 *
 * Sinon : pas de correspondance.
 */
export function namesLikelyMatch(a: string, b: string): boolean {
  const normalizedA = normalizeCompanyName(a);
  const normalizedB = normalizeCompanyName(b);
  if (normalizedA.length === 0 || normalizedB.length === 0) return false;
  if (normalizedA === normalizedB) return true;

  const tokensA = meaningfulTokens(normalizedA);
  const tokensB = meaningfulTokens(normalizedB);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  if (diceCoefficient(tokensA, tokensB) >= DICE_THRESHOLD) return true;

  const [shorter, longer] = tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];
  const longerSet = new Set(longer);
  const fullyContained = shorter.every((token) => longerSet.has(token));

  return fullyContained;
}
