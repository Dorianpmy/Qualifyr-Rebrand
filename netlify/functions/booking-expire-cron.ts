/**
 * Planificateur Netlify de l'expiration des blocages de créneau.
 *
 * Même principe que les autres tâches planifiées : aucune logique ici,
 * seulement l'appel à la route Next.js qui fait le travail
 * (`/api/detailing/expire-holds`). Toutes les cinq minutes : un blocage dure
 * quinze ou trente et une minutes, un passage plus rare laisserait le tableau
 * de bord du professionnel afficher trop longtemps des demandes mortes.
 */
export default async function bookingExpireCron() {
  const base = process.env.URL ?? 'https://qualifyragence.com';
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error('[booking-expire-cron] CRON_SECRET manquant — appel annulé.');
    return new Response('CRON_SECRET manquant', { status: 500 });
  }

  const response = await fetch(`${base}/api/detailing/expire-holds`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });

  return new Response(await response.text(), { status: response.status });
}

export const config = {
  schedule: '*/5 * * * *',
};
