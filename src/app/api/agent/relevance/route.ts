import { NextResponse } from 'next/server';

import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import { RELEVANCE_BATCH_SIZE, fetchRelevanceScores, type ScorableProspect } from '@/lib/agent/relevance';

/**
 * Classement par pertinence — calculé une fois, après l'analyse de zone.
 *
 * **Route distincte, jamais appelée depuis `/api/agent/process` ni
 * `/api/agent/outreach`.** La première a un budget de 60 s et un quota
 * Sirene à tenir (voir son commentaire d'en-tête) ; la seconde ne doit jamais
 * dépendre d'un fournisseur externe pour décider d'envoyer. Un appel Mistral
 * lent dans l'une ou l'autre menacerait exactement ce que ces deux routes
 * protègent. Son propre cron (`agent-relevance-cron.ts`) l'appelle
 * séparément.
 *
 * **Une campagne par passage, comme `outreach`.** Jusqu'à
 * `MAX_CAMPAIGNS_CHECKED` campagnes ayant renseigné leur activité sont
 * examinées, dans l'ordre de création ; la première qui a des prospects non
 * notés (`scored_at is null`) dans ses zones est celle traitée ce passage-ci,
 * par lots de `RELEVANCE_BATCH_SIZE`. Une campagne entièrement notée sort
 * naturellement de la sélection au passage suivant : pas besoin d'une
 * colonne de rotation dédiée.
 *
 * **Modèle indisponible = ordre actuel.** Si `fetchRelevanceScores` échoue —
 * configuration absente, réseau, quota, réponse illisible — rien n'est écrit
 * pour le lot en cours, et la route s'arrête là pour ce passage : `nextCandidates`
 * (`outreach.ts`) retombe sur son tri par défaut, Hermès continue d'envoyer.
 * C'est l'inverse des autres garde-fous d'Hermès, et c'est volontaire : ici
 * le classement est un confort, pas une condition d'envoi.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Campagnes examinées par passage avant d'abandonner : borne le coût d'une
 *  résolution d'e-mail propriétaire par campagne candidate. */
const MAX_CAMPAIGNS_CHECKED = 20;

/** Lots Mistral par passage pour la campagne retenue (100 prospects) : une
 *  zone dépasse rarement ce total (trois codes postaux × quatre segments,
 *  vingt par segment maximum), et deux appels tiennent largement dans la
 *  marge du budget de 60 s. Le reste attend le passage suivant. */
const MAX_BATCHES_PER_PASS = 2;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'non autorisé' }, { status: 401 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'base indisponible' }, { status: 503 });
  }

  if (!process.env.MISTRAL_API_KEY) {
    // Absence de configuration = pas de classement, jamais un blocage — voir
    // le commentaire d'en-tête.
    return NextResponse.json({ processed: 0, reason: 'MISTRAL_API_KEY absente' });
  }

  const { data: campaigns } = await supabase
    .from('hermes_campaigns')
    .select('id, owner_id, activity_description')
    .not('activity_description', 'is', null)
    .order('created_at', { ascending: true })
    .limit(MAX_CAMPAIGNS_CHECKED);

  if (!campaigns || campaigns.length === 0) {
    return NextResponse.json({ processed: 0, reason: 'aucune activité renseignée' });
  }

  for (const campaign of campaigns) {
    // Même résolution que `outreach/route.ts` : le périmètre d'une campagne
    // se définit par l'e-mail de son propriétaire, pas par une relation en
    // base entre `hermes_campaigns` et `agent_zones`.
    const { data: userData } = await supabase.auth.admin.getUserById(campaign.owner_id as string);
    const ownerEmail = userData?.user?.email;
    if (!ownerEmail) continue;

    const { data: zones } = await supabase.from('agent_zones').select('id').ilike('email', ownerEmail);
    if (!zones || zones.length === 0) continue;
    const zoneIds = zones.map((zone) => zone.id as string);

    const { data: prospects } = await supabase
      .from('agent_prospects')
      .select('id, name, naf_code, city, workforce_range')
      .in('zone_id', zoneIds)
      .is('scored_at', null)
      .order('created_at', { ascending: true })
      .limit(RELEVANCE_BATCH_SIZE * MAX_BATCHES_PER_PASS);

    if (!prospects || prospects.length === 0) continue; // rien à classer pour cette campagne, essayer la suivante

    const activityDescription = campaign.activity_description as string;
    let scoredCount = 0;

    for (let offset = 0; offset < prospects.length; offset += RELEVANCE_BATCH_SIZE) {
      const chunk = prospects.slice(offset, offset + RELEVANCE_BATCH_SIZE) as readonly {
        id: string;
        name: string;
        naf_code: string | null;
        city: string | null;
        workforce_range: string | null;
      }[];

      const scorable: readonly ScorableProspect[] = chunk.map((row) => ({
        id: row.id,
        name: row.name,
        nafCode: row.naf_code,
        city: row.city,
        workforceRange: row.workforce_range,
      }));

      const result = await fetchRelevanceScores({ activityDescription, prospects: scorable });

      if (!result.ok) {
        console.error('[agent/relevance] Mistral indisponible', campaign.id);
        return NextResponse.json({
          processed: scoredCount,
          campaign: campaign.id,
          reason: 'mistral indisponible',
        });
      }

      const scoredAt = new Date().toISOString();
      for (const [index, score] of result.scoresByIndex) {
        const prospect = scorable[index];
        if (!prospect) continue;
        const { error } = await supabase
          .from('agent_prospects')
          .update({ relevance_score: score, scored_at: scoredAt })
          .eq('id', prospect.id);
        if (error) {
          console.error('[agent/relevance] écriture impossible', prospect.id, error.message);
        }
      }

      scoredCount += scorable.length;
    }

    return NextResponse.json({ processed: scoredCount, campaign: campaign.id });
  }

  return NextResponse.json({ processed: 0, reason: 'rien à classer' });
}
