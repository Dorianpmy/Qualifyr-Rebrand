import { NextResponse } from 'next/server';

import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import { nearbyPostalCodes } from '@/lib/agent/postal-codes';
import { namesLikelyMatch } from '@/lib/agent/company-match';
import {
  OSM_ENRICHABLE_SEGMENTS,
  fetchOsmEstablishments,
  fetchWebsiteEmail,
  isEmailOverAttributed,
  isUsableEmail,
  type OsmFeature,
} from '@/lib/agent/osm-enrich';
import type { SegmentKey } from '@/lib/agent/sirene';

/**
 * Hermès — enrichissement e-mail/téléphone par OpenStreetMap.
 *
 * **Route distincte, son propre cron (`agent-enrich-cron.ts`), jamais
 * appelée depuis `/api/agent/process` ni `/api/agent/outreach`.** Même
 * raisonnement que `/api/agent/relevance` : un fournisseur externe lent (ici,
 * Overpass et des sites tiers arbitraires) ne doit jamais menacer le budget
 * d'une route qui a un quota à tenir (Sirene) ou une décision d'envoi à
 * prendre.
 *
 * **Une zone par passage, un seul appel Overpass** — voir l'en-tête de
 * `lib/agent/osm-enrich.ts` sur pourquoi ce n'est jamais par entreprise.
 * Sélection en tourniquet sur `agent_zones.enrichment_attempted_at` (la
 * moins récemment tentée d'abord), même idiome que `report_first_failed_at`
 * pour les renvois de rapport.
 *
 * **Budget de la fonction, calculé et non estimé** (même exigence que
 * `agent/process/route.ts`). Overpass est plafonné à 20 s
 * (`fetchOsmEstablishments`). Chaque fetch de site est plafonné à 4 s, et
 * `fetchWebsiteEmail` en fait au plus deux (page d'accueil, puis une page de
 * contact) : 8 s au pire par prospect. `MAX_SITE_FETCHES_PER_PASS` prospects
 * traités au maximum : 4 × 8 s = 32 s. Total pire cas : 20 + 32 = 52 s, sous
 * les 60 s de `maxDuration`, marge restante pour les lectures/écritures
 * Supabase.
 *
 * **Overpass indisponible : ni la zone ni les prospects ne sont touchés.**
 * Le passage suivant retente la même zone, sans brûler de tentative sur les
 * prospects — l'échec est celui de la source, pas la preuve qu'ils sont
 * injoignables.
 *
 * **Plafond de tentatives par prospect, en nombre de passages** — voir la
 * migration 021 sur pourquoi ce plafond est un compteur et non un âge, à la
 * différence de `report-retry.ts`.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Voir la migration 021 : au-delà, un prospect sans e-mail n'en aura pas
 *  davantage à un onzième passage, et cesse d'être candidat. */
const MAX_ENRICHMENT_ATTEMPTS = 10;

/** Voir le calcul de budget en en-tête de fichier. */
const MAX_SITE_FETCHES_PER_PASS = 4;

/** Bassin de prospects examiné pour choisir la zone la moins récemment
 *  tentée — large mais borné, une seule fois par passage. */
const ZONE_CANDIDATE_POOL = 500;

type ProspectRow = {
  readonly id: string;
  readonly name: string;
  readonly segment: SegmentKey;
  readonly siret: string | null;
  readonly enrichment_attempts: number;
};

async function pickZone(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
): Promise<{ readonly id: string; readonly postalCode: string; readonly radiusKm: number } | null> {
  const { data: pending } = await supabase
    .from('agent_prospects')
    .select('zone_id')
    .in('segment', OSM_ENRICHABLE_SEGMENTS)
    .is('email', null)
    .is('opted_out_at', null)
    .lt('enrichment_attempts', MAX_ENRICHMENT_ATTEMPTS)
    .limit(ZONE_CANDIDATE_POOL);

  if (!pending || pending.length === 0) return null;

  const zoneIds = Array.from(new Set(pending.map((row) => row.zone_id as string)));

  const { data: zones } = await supabase
    .from('agent_zones')
    .select('id, postal_code, radius_km')
    .in('id', zoneIds)
    .order('enrichment_attempted_at', { ascending: true, nullsFirst: true })
    .limit(1);

  const zone = zones?.[0];
  if (!zone) return null;

  return {
    id: zone.id as string,
    postalCode: zone.postal_code as string,
    radiusKm: Number(zone.radius_km),
  };
}

/**
 * Écrit le résultat d'une tentative d'enrichissement sur un prospect.
 *
 * `phone`/`website` sont écrits dès qu'ils sont connus, indépendamment de la
 * réussite de l'e-mail : les colonnes existent depuis la migration 010,
 * restaient vides, et le rapport de secteur du professionnel (page
 * `/app/prospection/[id]`) les affiche déjà. Le numéro de téléphone n'est pas
 * un à-côté : c'est ce que l'offre « Agent » vend — recenser des entreprises
 * à appeler.
 */
async function writeAttempt(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  prospect: ProspectRow,
  now: string,
  found: { readonly email: string; readonly source: 'osm_tag' | 'site_web' } | null,
  extra: { readonly phone: string | null; readonly website: string | null },
): Promise<void> {
  const update: Record<string, unknown> = {
    enriched_at: now,
    enrichment_attempts: prospect.enrichment_attempts + 1,
  };
  if (found) {
    update.email = found.email;
    update.email_source = found.source;
  }
  if (extra.phone) update.phone = extra.phone;
  if (extra.website) update.website = extra.website;

  const { error } = await supabase.from('agent_prospects').update(update).eq('id', prospect.id);
  if (error) {
    console.error('[agent/enrich] écriture impossible', prospect.id, error.message);
  }
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'non autorisé' }, { status: 401 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'base indisponible' }, { status: 503 });
  }

  const zone = await pickZone(supabase);
  if (!zone) {
    return NextResponse.json({ processed: 0, reason: 'rien à enrichir' });
  }

  const postalCodes = nearbyPostalCodes(zone.postalCode, zone.radiusKm);
  const osmResult = await fetchOsmEstablishments({ postalCodes, segments: OSM_ENRICHABLE_SEGMENTS });

  if (!osmResult.ok) {
    // Ni la zone ni les prospects ne sont touchés — voir l'en-tête de fichier.
    return NextResponse.json({ processed: 0, zone: zone.id, reason: 'osm indisponible' });
  }

  const now = new Date().toISOString();
  await supabase.from('agent_zones').update({ enrichment_attempted_at: now }).eq('id', zone.id);

  const { data: prospects } = await supabase
    .from('agent_prospects')
    .select('id, name, segment, siret, enrichment_attempts')
    .eq('zone_id', zone.id)
    .in('segment', OSM_ENRICHABLE_SEGMENTS)
    .is('email', null)
    .is('opted_out_at', null)
    .lt('enrichment_attempts', MAX_ENRICHMENT_ATTEMPTS)
    .order('created_at', { ascending: true });

  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ processed: 0, zone: zone.id, reason: 'aucun prospect à enrichir' });
  }

  let matchedTag = 0;
  let matchedWebsite = 0;
  let noMatch = 0;
  let skippedBudget = 0;
  let siteFetchesUsed = 0;

  for (const prospect of prospects as unknown as readonly ProspectRow[]) {
    // Jamais un prospect `loueurs` comparé à un établissement `concessions`,
    // et inversement — voir `OsmFeature.segment`.
    const candidates = osmResult.features.filter((feature) => feature.segment === prospect.segment);
    const match: OsmFeature | undefined = candidates.find((feature) =>
      namesLikelyMatch(prospect.name, feature.name),
    );

    if (!match) {
      noMatch += 1;
      await writeAttempt(supabase, prospect, now, null, { phone: null, website: null });
      continue;
    }

    // 1. Le tag `email` d'OpenStreetMap, gratuit — aucun coût réseau.
    if (match.email && isUsableEmail(match.email)) {
      const overAttributed = await isEmailOverAttributed(supabase, match.email);
      if (!overAttributed) {
        await writeAttempt(
          supabase,
          prospect,
          now,
          { email: match.email, source: 'osm_tag' },
          { phone: match.phone, website: match.website },
        );
        matchedTag += 1;
        continue;
      }
      // Sur-attribuée (voir MAX_SHARED_EMAIL_ATTRIBUTIONS) : on retombe sur
      // le site, s'il existe.
    }

    // 2. Le site indiqué par OpenStreetMap, borné par passage.
    if (match.website) {
      if (siteFetchesUsed >= MAX_SITE_FETCHES_PER_PASS) {
        // Budget de ce passage épuisé : ni écrit, ni compté comme tenté — ce
        // prospect reste candidat, repris à la prochaine visite de cette
        // zone dans le tourniquet.
        skippedBudget += 1;
        continue;
      }
      siteFetchesUsed += 1;

      const email = await fetchWebsiteEmail(match.website);
      const usable = email && isUsableEmail(email) ? email : null;
      const overAttributed = usable ? await isEmailOverAttributed(supabase, usable) : false;

      if (usable && !overAttributed) {
        await writeAttempt(
          supabase,
          prospect,
          now,
          { email: usable, source: 'site_web' },
          { phone: match.phone, website: match.website },
        );
        matchedWebsite += 1;
      } else {
        await writeAttempt(supabase, prospect, now, null, { phone: match.phone, website: match.website });
        noMatch += 1;
      }
      continue;
    }

    // Matché sur le nom, mais ni tag e-mail exploitable ni site à essayer.
    noMatch += 1;
    await writeAttempt(supabase, prospect, now, null, { phone: match.phone, website: match.website });
  }

  return NextResponse.json({
    zone: zone.id,
    matchedTag,
    matchedWebsite,
    noMatch,
    skippedBudget,
  });
}
