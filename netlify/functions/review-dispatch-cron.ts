/**
 * Planificateur Netlify de l'envoi différé des demandes d'avis Google.
 *
 * Même principe que agent-process-cron.ts : aucune logique ici, seulement
 * l'appel à la route Next.js (`/api/detailing/review-dispatch`) qui fait le
 * travail. Une fois par heure — la demande part trois heures après la fin de
 * la prestation, une heure de granularité suffit largement.
 */
export default async function reviewDispatchCron() {
  const base = process.env.URL ?? 'https://qualifyragence.com';
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error('[review-dispatch-cron] CRON_SECRET manquant — appel annulé.');
    return new Response('CRON_SECRET manquant', { status: 500 });
  }

  const response = await fetch(`${base}/api/detailing/review-dispatch`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });

  return new Response(await response.text(), { status: response.status });
};

export const config = {
  schedule: '0 * * * *',
};
