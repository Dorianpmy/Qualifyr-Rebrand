import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { detailingServiceEnv } from './env';

export type DetailerCase = {
  id: string;
  detailer_id: string;
  title: string;
  vehicle_label: string | null;
  service_label: string | null;
  before_url: string;
  after_url: string;
  published: boolean;
  sort_order: number;
  created_at: string;
};

function admin() {
  const env = detailingServiceEnv();
  if (!env) return null;
  return createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function listCasesForDetailer(detailerId: string): Promise<DetailerCase[]> {
  const client = admin();
  if (!client) return [];
  const { data } = await client
    .from('detailer_cases')
    .select('*')
    .eq('detailer_id', detailerId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  return (data as DetailerCase[]) ?? [];
}

export async function listPublishedCases(detailerId: string): Promise<DetailerCase[]> {
  const client = admin();
  if (!client) return [];
  const { data } = await client
    .from('detailer_cases')
    .select('*')
    .eq('detailer_id', detailerId)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .limit(24);
  return (data as DetailerCase[]) ?? [];
}

export async function createCase(input: {
  detailerId: string;
  title: string;
  vehicleLabel?: string;
  serviceLabel?: string;
  beforeUrl: string;
  afterUrl: string;
}): Promise<{ id: string } | null> {
  const client = admin();
  if (!client) return null;
  const { data, error } = await client
    .from('detailer_cases')
    .insert({
      detailer_id: input.detailerId,
      title: input.title,
      vehicle_label: input.vehicleLabel ?? null,
      service_label: input.serviceLabel ?? null,
      before_url: input.beforeUrl,
      after_url: input.afterUrl,
      published: true,
    })
    .select('id')
    .single();
  if (error || !data) return null;
  return { id: data.id as string };
}
