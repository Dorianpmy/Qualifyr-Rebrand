/**
 * Planificateur Netlify de la prospection Hermès.
 *
 * Même patron que `agent-process-cron` : aucune logique métier ici, seulement
 * l'appel authentifié de `/api/agent/outreach`, qui porte les garde-fous
 * (quota, liste de suppression, périmètre du compte, abonnement actif).
 *
 * **Le créneau n'est pas cosmétique.** Un message de démarchage qui arrive à
 * trois heures du matin se lit comme du spam avant même d'être ouvert, et se
 * signale comme tel. Les envois sont donc bornés aux heures ouvrées, du lundi
 * au vendredi.
 *
 * **Attention : Netlify interprète ce cron en UTC.** `7-16` correspond donc à
 * 9h–18h30 à Paris en heure d'été (UTC+2) et à 8h–17h30 en heure d'hiver
 * (UTC+1). Le décalage saisonnier d'une heure est assumé — le corriger
 * demanderait deux fonctions et un basculement manuel deux fois par an, pour
 * un gain nul.
 *
 * Toutes les trente minutes, cinq messages par passage (`BATCH_SIZE` dans la
 * route) : le rythme reste très en deçà du quota quotidien choisi par le
 * professionnel, qui est le vrai plafond.
 */
export default async function hermesOutreachCron() {
  const base = process.env.URL ?? 'https://qualifyragence.com';
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error('[hermes-outreach-cron] CRON_SECRET manquant — appel annulé.');
    return new Response('CRON_SECRET manquant', { status: 500 });
  }

  const response = await fetch(`${base}/api/agent/outreach`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });

  return new Response(await response.text(), { status: response.status });
}

export const config = {
  schedule: '*/30 7-16 * * 1-5',
};
