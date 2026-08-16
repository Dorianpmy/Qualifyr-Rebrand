/**
 * Planificateur Netlify du traitement différé de l'agent.
 *
 * Netlify ne lit pas vercel.json — les tâches planifiées se déclarent comme
 * des fonctions Netlify portant un `schedule`. Cette fonction ne contient
 * aucune logique métier : elle appelle la vraie route Next.js
 * (`/api/agent/process`), qui fait tout le travail. La séparer ainsi évite
 * de dupliquer le traitement dans deux runtimes différents.
 *
 * Toutes les quinze minutes : une analyse dure une à deux minutes à cause du
 * quota Sirene, et prend une zone à la fois — ce rythme vide la file sans la
 * saturer.
 */
export default async function agentProcessCron() {
  const base = process.env.URL ?? 'https://qualifyragence.com';
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error('[agent-process-cron] CRON_SECRET manquant — appel annulé.');
    return new Response('CRON_SECRET manquant', { status: 500 });
  }

  const response = await fetch(`${base}/api/agent/process`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });

  return new Response(await response.text(), { status: response.status });
};

export const config = {
  schedule: '*/15 * * * *',
};
