/**
 * Planificateur Netlify du classement par pertinence.
 *
 * Même patron que les autres crons : aucune logique métier ici, seulement
 * l'appel authentifié de `/api/agent/relevance`, qui porte les garde-fous
 * (validation de la réponse Mistral, score `null` en cas d'échec, jamais de
 * blocage de l'envoi).
 *
 * Toutes les quinze minutes, comme `agent-process-cron` : le classement doit
 * suivre le rythme des nouvelles zones analysées, sans jamais partager son
 * passage avec l'analyse elle-même (voir le commentaire d'en-tête de la
 * route — un appel Mistral lent ne doit jamais menacer le budget de
 * `/api/agent/process`).
 */
export default async function agentRelevanceCron() {
  const base = process.env.URL ?? 'https://qualifyragence.com';
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error('[agent-relevance-cron] CRON_SECRET manquant — appel annulé.');
    return new Response('CRON_SECRET manquant', { status: 500 });
  }

  const response = await fetch(`${base}/api/agent/relevance`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });

  return new Response(await response.text(), { status: response.status });
}

export const config = {
  schedule: '*/15 * * * *',
};
