/**
 * Planificateur Netlify du traitement différé de l'agent.
 *
 * Netlify ne lit pas vercel.json — les tâches planifiées se déclarent comme
 * des fonctions Netlify portant un `schedule`. Cette fonction ne contient
 * aucune logique métier : elle appelle la vraie route Next.js
 * (`/api/agent/process`), qui fait tout le travail. La séparer ainsi évite
 * de dupliquer le traitement dans deux runtimes différents.
 *
 * Toutes les quinze minutes, une zone à la fois. Une analyse tient dans la
 * limite de 60 s de `/api/agent/process` (`maxDuration`) avec de la marge :
 * jusqu'à trois codes postaux (`nearbyPostalCodes`) × quatre segments
 * (`SEGMENTS`) = douze appels Sirene au maximum, chacun suivi d'une pause
 * fixe de 1,5 s pour tenir le quota — 18 s de pause garantie, plus la latence
 * réelle des appels, pour un total d'environ vingt secondes. (Corrigé le
 * 24/08/2026 : ce commentaire annonçait « une à deux minutes », en
 * contradiction avec le commentaire de la route elle-même — la mesure
 * ci-dessus vient du calcul, pas d'une estimation.)
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
