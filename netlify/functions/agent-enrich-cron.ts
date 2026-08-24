/**
 * Planificateur Netlify de l'enrichissement OpenStreetMap.
 *
 * Même patron que les autres crons : aucune logique métier ici, seulement
 * l'appel authentifié de `/api/agent/enrich`, qui porte les garde-fous
 * (une zone par passage, un seul appel Overpass, plafond de tentatives par
 * prospect, budget réseau borné).
 *
 * **Toutes les trente minutes, plus lent que `agent-process-cron` et
 * `agent-relevance-cron` (quinze).** Overpass demande une utilisation
 * mesurée, et chaque passage peut approcher les 52 s calculées dans le
 * commentaire d'en-tête de la route (contre une vingtaine de secondes pour
 * l'analyse Sirene) : trente minutes laisse une marge nette entre deux
 * passages plutôt que de les faire se chevaucher au moindre ralentissement
 * d'un site tiers.
 */
export default async function agentEnrichCron() {
  const base = process.env.URL ?? 'https://qualifyragence.com';
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error('[agent-enrich-cron] CRON_SECRET manquant — appel annulé.');
    return new Response('CRON_SECRET manquant', { status: 500 });
  }

  const response = await fetch(`${base}/api/agent/enrich`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });

  return new Response(await response.text(), { status: response.status });
}

export const config = {
  schedule: '*/30 * * * *',
};
