/**
 * Décide ce qu'il advient d'une zone après une tentative d'envoi de rapport.
 *
 * **Pourquoi une fonction séparée de la route.** Même principe que
 * `lib/agent/outreach.ts` pour Hermès : la décision est testable sans réseau
 * ni base, la route ne fait qu'appeler ces fonctions et écrire leur résultat.
 *
 * **Le plafond se mesure en temps, pas en tentatives.** `/api/agent/process`
 * ne traite qu'un lot borné de renvois par passage (`REPORT_RETRY_BATCH`
 * dans la route) : le nombre de fois qu'une zone donnée est retentée dépend
 * donc de la longueur de la file de renvois à cet instant, pas d'une cadence
 * fixe. Compter les tentatives et les comparer à un plafond aurait fait
 * dépendre le délai réel du débit de la file — dix zones en attente
 * auraient multiplié par dix le temps avant abandon. `previousFirstFailedAt`
 * porte l'horloge : elle ne dépend ni du débit de la file, ni d'un
 * changement futur de fréquence du cron ou de taille des lots.
 *
 * `previousAttempts` est conservé et incrémenté, mais **ne pilote plus la
 * décision** — seul le diagnostic (combien de fois a-t-on essayé) en a
 * l'usage. Ne pas le rebrancher sur le plafond : c'est précisément ce que
 * cette conception évite.
 *
 * **`total === 0` est une fin normale.** Aucun établissement trouvé n'est
 * pas un échec d'envoi — il n'y a simplement rien à envoyer.
 */

/** Au-delà de cet écart avec le premier échec, la zone passe en `echec`
 *  plutôt que d'être retentée indéfiniment. Une configuration absente ne se
 *  résout jamais toute seule, contrairement à un créneau qui part à
 *  quelqu'un d'autre (voir `booking-recovery`, qui ne plafonne pas) — mais
 *  retenter ne coûte qu'une requête, pas de quota Sirene : autant laisser
 *  une vraie journée avant de considérer que c'est un incident à regarder,
 *  plutôt qu'un simple délai de rattrapage. */
export const MAX_REPORT_AGE_MS = 24 * 60 * 60 * 1000;

export type ReportStatus = 'termine' | 'rapport_en_attente' | 'echec';

export type ReportRetryState = {
  readonly status: ReportStatus;
  readonly reportAttempts: number;
  readonly reportFirstFailedAt: string | null;
};

export function nextReportState(input: {
  readonly total: number;
  readonly reportSent: boolean;
  readonly previousAttempts: number;
  readonly previousFirstFailedAt: string | null;
  /** Passée en paramètre plutôt que lue via `Date.now()` : la fonction reste
   *  testable sans horloge truquée. */
  readonly now: Date;
}): ReportRetryState {
  if (input.total === 0 || input.reportSent) {
    return { status: 'termine', reportAttempts: input.previousAttempts, reportFirstFailedAt: null };
  }

  const reportAttempts = input.previousAttempts + 1;
  const firstFailedAt = input.previousFirstFailedAt ?? input.now.toISOString();
  const ageMs = input.now.getTime() - new Date(firstFailedAt).getTime();

  return {
    status: ageMs >= MAX_REPORT_AGE_MS ? 'echec' : 'rapport_en_attente',
    reportAttempts,
    reportFirstFailedAt: firstFailedAt,
  };
}

/**
 * Compose `agent_zones.error_message`.
 *
 * **Sur un renvoi, il n'y a pas d'erreurs de scan** : `scanErrors` est alors
 * toujours vide, puisque `rapport_en_attente` signifie précisément que
 * l'analyse Sirene n'est pas rejouée. Une version naïve qui écrirait `null`
 * dès que `scanErrors` est vide effacerait le diagnostic à chaque renvoi qui
 * échoue à nouveau — c'est `sendFailureReason` qui porte l'information utile
 * dans ce cas, jamais `null` tant que l'envoi échoue.
 */
export function buildReportErrorMessage(input: {
  readonly scanErrors: readonly string[];
  readonly sendFailureReason: string | null;
  readonly capped: boolean;
  readonly attempts: number;
}): string | null {
  const parts: string[] = [];
  if (input.scanErrors.length > 0) parts.push(input.scanErrors.slice(0, 5).join(' | '));
  if (input.sendFailureReason) parts.push(input.sendFailureReason);

  if (parts.length === 0) return null;

  const message = parts.join(' | ');
  return input.capped
    ? `${message} — abandon après ${input.attempts} tentative(s) sur ${MAX_REPORT_AGE_MS / 3_600_000}h`
    : message;
}
