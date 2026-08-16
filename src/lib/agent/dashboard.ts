import 'server-only';
import { getServiceSupabaseClient } from '../detailing/supabase-server';
import type { SegmentKey } from './sirene';

/**
 * Lecture des zones et prospects pour l'espace pro.
 *
 * Toutes les requêtes filtrent explicitement sur `detailer_id` : deux
 * detailers ne doivent jamais pouvoir lire les prospects l'un de l'autre,
 * même si un identifiant de zone fuite dans une URL.
 */

export type DashboardZone = {
  readonly id: string;
  readonly postalCode: string;
  readonly country: string;
  readonly isFree: boolean;
  readonly status: string;
  readonly segments: Partial<Record<SegmentKey, number>> | null;
  readonly errorMessage: string | null;
  readonly processedAt: string | null;
  readonly reportSentAt: string | null;
  readonly createdAt: string;
  readonly prospectCount: number;
};

export type DashboardProspect = {
  readonly id: string;
  readonly name: string;
  readonly segment: string;
  readonly address: string | null;
  readonly postalCode: string | null;
  readonly city: string | null;
  readonly workforceRange: string | null;
  readonly phone: string | null;
  readonly website: string | null;
};

/**
 * Rattache au compte les zones lancées avant inscription depuis le
 * formulaire public — même e-mail, `detailer_id` encore vide.
 *
 * Appelée à chaque chargement de la page : idempotente, sans effet une fois
 * les zones déjà rattachées.
 */
export async function claimZonesForDetailer(detailerId: string, email: string): Promise<void> {
  const client = getServiceSupabaseClient();
  if (!client) return;

  await client
    .from('agent_zones')
    .update({ detailer_id: detailerId })
    .is('detailer_id', null)
    .ilike('email', email);
}

export async function listZonesForDetailer(detailerId: string): Promise<readonly DashboardZone[]> {
  const client = getServiceSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('agent_zones')
    .select(
      'id, postal_code, country, is_free, status, segments, error_message, processed_at, report_sent_at, created_at, agent_prospects(count)',
    )
    .eq('detailer_id', detailerId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const prospects = row.agent_prospects as unknown;
    const prospectCount =
      Array.isArray(prospects) && prospects[0] && typeof prospects[0] === 'object'
        ? Number((prospects[0] as { count: number }).count ?? 0)
        : 0;

    return {
      id: row.id as string,
      postalCode: row.postal_code as string,
      country: row.country as string,
      isFree: Boolean(row.is_free),
      status: row.status as string,
      segments: (row.segments as Partial<Record<SegmentKey, number>> | null) ?? null,
      errorMessage: (row.error_message as string | null) ?? null,
      processedAt: (row.processed_at as string | null) ?? null,
      reportSentAt: (row.report_sent_at as string | null) ?? null,
      createdAt: row.created_at as string,
      prospectCount,
    };
  });
}

export async function getZoneForDetailer(
  zoneId: string,
  detailerId: string,
): Promise<DashboardZone | null> {
  const zones = await listZonesForDetailer(detailerId);
  return zones.find((zone) => zone.id === zoneId) ?? null;
}

export async function listProspectsForZone(
  zoneId: string,
  detailerId: string,
): Promise<readonly DashboardProspect[]> {
  const client = getServiceSupabaseClient();
  if (!client) return [];

  // La zone doit appartenir au detailer : sans cette vérification, connaître
  // l'UUID d'une zone d'un tiers suffirait à lire ses prospects.
  const { data: zone } = await client
    .from('agent_zones')
    .select('id')
    .eq('id', zoneId)
    .eq('detailer_id', detailerId)
    .maybeSingle();

  if (!zone) return [];

  const { data, error } = await client
    .from('agent_prospects')
    .select('id, name, segment, address, postal_code, city, workforce_range, phone, website')
    .eq('zone_id', zoneId)
    .order('name', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    segment: row.segment as string,
    address: (row.address as string | null) ?? null,
    postalCode: (row.postal_code as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    workforceRange: (row.workforce_range as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    website: (row.website as string | null) ?? null,
  }));
}
