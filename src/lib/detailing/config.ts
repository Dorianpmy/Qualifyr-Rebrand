import { getPublicSupabaseClient } from './supabase-browser';
import { getServiceSupabaseClient } from './supabase-server';
import type {
  AvailabilityConfig,
  DetailerConfig,
  OptionKey,
  Scope,
  SoilingLevel,
  VehicleSize,
} from './types';

export type DetailerRecord = {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly email: string | null;
  readonly city: string | null;
  /** 'FR' ou 'CH' — pilote devise, TVA, code postal et indicatif. */
  readonly country: string;
  readonly freeCancellationHours: number;
  readonly insuranceLabel: string | null;
  readonly yearsExperience: number | null;
  readonly intro: string | null;
  /**
   * Noms commerciaux des formules, tels que le professionnel les vend.
   * Vide pour une formule qu'il n'a pas renommée : le libellé standard
   * s'applique alors.
   */
  readonly scopeLabels: Readonly<Record<string, { label: string; description: string | null }>>;
  /** Adresse de départ géocodée, `null` tant qu'elle n'est pas renseignée. */
  readonly base: { readonly lat: number; readonly lon: number } | null;
  readonly baseAddress: string | null;
  readonly mobileService: boolean;
  readonly workshopService: boolean;
  readonly workshopAddress: string | null;
  readonly quoteConfig: DetailerConfig;
  readonly availabilityConfig: AvailabilityConfig;
};

/**
 * Charge la fiche publique d'un professionnel.
 * Préfère le service role côté serveur (ignore RLS) ; fallback anon.
 */
export async function loadDetailerBySlug(slug: string): Promise<DetailerRecord | null> {
  const client = getServiceSupabaseClient() ?? getPublicSupabaseClient();
  if (!client) return null;

  const { data: detailer, error: detailerError } = await client
    .from('detailers')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (detailerError || !detailer) return null;

  const [pricesRes, optionsRes, soilingRes, availabilityRes, closuresRes, labelsRes] =
    await Promise.all([
    client.from('detailer_prices').select('*').eq('detailer_id', detailer.id),
    client.from('detailer_options').select('*').eq('detailer_id', detailer.id).eq('enabled', true),
    client.from('detailer_soiling').select('*').eq('detailer_id', detailer.id),
    client.from('detailer_availability').select('*').eq('detailer_id', detailer.id),
    client
      .from('detailer_closures')
      .select('*')
      .eq('detailer_id', detailer.id)
      .gte('ends_at', new Date().toISOString()),
      client.from('detailer_scope_labels').select('*').eq('detailer_id', detailer.id),
    ]);

  const scopeLabels: Record<string, { label: string; description: string | null }> = {};
  for (const row of labelsRes.data ?? []) {
    scopeLabels[String(row.scope)] = {
      label: String(row.label),
      description: (row.description as string | null) ?? null,
    };
  }

  const quoteConfig: DetailerConfig = {
    prices: (pricesRes.data ?? []).map((row) => ({
      scope: row.scope as Scope,
      vehicleSize: row.vehicle_size as VehicleSize,
      basePrice: Number(row.base_price),
      baseMinutes: Number(row.base_minutes),
    })),
    options: (optionsRes.data ?? []).map((row) => ({
      key: row.option_key as OptionKey,
      enabled: Boolean(row.enabled),
      price: Number(row.price),
      minutes: Number(row.minutes),
      scaleWithSize: Boolean(row.scale_with_size),
      affectedBySoiling: Boolean(row.affected_by_soiling),
    })),
    soiling: (soilingRes.data ?? []).map((row) => ({
      level: row.level as SoilingLevel,
      labourMultiplier: Number(row.labour_multiplier),
    })),
    travelFreeRadiusKm: Number(detailer.travel_free_radius_km),
    travelFeePerKm: Number(detailer.travel_fee_per_km),
    travelMaxKm: Number(detailer.travel_max_km),
    longJobThresholdMinutes: Number(detailer.long_job_threshold_minutes),
    depositEnabled: Boolean(detailer.deposit_enabled),
    depositPercent: Number(detailer.deposit_percent),
  };

  const availabilityConfig: AvailabilityConfig = {
    weekly: (availabilityRes.data ?? []).map((row) => ({
      weekday: Number(row.weekday),
      opensAt: String(row.opens_at),
      closesAt: String(row.closes_at),
      bufferMinutes: Number(row.buffer_minutes),
    })),
    closures: (closuresRes.data ?? []).map((row) => ({
      startsAt: new Date(row.starts_at as string),
      endsAt: new Date(row.ends_at as string),
    })),
    minBookingNoticeHours: Number(detailer.min_booking_notice_hours),
    slotGranularityMinutes: Number(detailer.slot_granularity_minutes),
  };

  return {
    id: detailer.id as string,
    slug: detailer.slug as string,
    name: detailer.name as string,
    email: (detailer.email as string | null) ?? null,
    city: (detailer.city as string | null) ?? null,
    country: (detailer.country as string | null) ?? 'FR',
    // Valeur de repli si la migration 004 n'est pas encore passée : une
    // annulation gratuite promise à tort vaut mieux qu'un `NaN` affiché.
    freeCancellationHours: Number(detailer.free_cancellation_hours ?? 24),
    insuranceLabel: (detailer.insurance_label as string | null) ?? null,
    yearsExperience:
      detailer.years_experience == null ? null : Number(detailer.years_experience),
    intro: (detailer.intro as string | null) ?? null,
    scopeLabels,
    base:
      detailer.base_latitude != null && detailer.base_longitude != null
        ? { lat: Number(detailer.base_latitude), lon: Number(detailer.base_longitude) }
        : null,
    baseAddress: (detailer.base_address as string | null) ?? null,
    mobileService: Boolean(detailer.mobile_service),
    workshopService: Boolean(detailer.workshop_service),
    workshopAddress: (detailer.workshop_address as string | null) ?? null,
    quoteConfig,
    availabilityConfig,
  };
}
