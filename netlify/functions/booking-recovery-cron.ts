/**
 * Planificateur Netlify de la relance des devis abandonnés.
 *
 * Même principe que les deux autres tâches planifiées : aucune logique ici,
 * seulement l'appel à la route Next.js qui fait le travail. Toutes les quinze
 * minutes — le seuil de relance (30 minutes après l'expiration du blocage) a
 * besoin de cette granularité pour ne pas laisser traîner un client encore
 * chaud.
 */
export default async function bookingRecoveryCron() {
  const base = process.env.URL ?? 'https://qualifyragence.com';
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error('[booking-recovery-cron] CRON_SECRET manquant — appel annulé.');
    return new Response('CRON_SECRET manquant', { status: 500 });
  }

  const response = await fetch(`${base}/api/detailing/booking-recovery`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });

  return new Response(await response.text(), { status: response.status });
}

export const config = {
  schedule: '*/15 * * * *',
};
