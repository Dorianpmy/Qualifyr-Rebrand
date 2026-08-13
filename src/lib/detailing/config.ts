import { getPublicSupabaseClient } from './supabase-browser';
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
  readonly mobileService: boolean;
  readonly workshopService: boolean;
  readonly workshopAddress: string | null;
  readonly quoteConfig: DetailerConfig;
  readonly availabilityConfig: AvailabilityConfig;
};

/**
 * Charge la fiche publique d'un professionnel et tout ce dont les moteurs de
 * devis et de créneaux ont besoin.
 */
export async function loadDetailerBySlug(slug: string): Promise<DetailerRecord | null> {
  const client = getPublicSupabaseClient();
  if (!client) return null;

  const { data: detailer, error: detailerError } = await client
    .from('detailers')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (detailerError || !detailer) return null;

  const [pricesRes, optionsRes, soilingRes, availabilityRes, closuresRes] = await Promise.all([
    client.from('detailer_prices').select('*').eq('detailer_id', detailer.id),
    client.from('detailer_options').select('*').eq('detailer_id', detailer.id).eq('enabled', true),
    client.from('detailer_soiling').select('*').eq('detailer_id', detailer.id),
    client.from('detailer_availability').select('*').eq('detailer_id', detailer.id),
    client
      .from('detailer_closures')
      .select('*')
      .eq('detailer_id', detailer.id)
      .gte('ends_at', new Date().toISOString()),
  ]);

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
    mobileService: Boolean(detailer.mobile_service),
    workshopService: Boolean(detailer.workshop_service),
    workshopAddress: (detailer.workshop_address as string | null) ?? null,
    quoteConfig,
    availabilityConfig,
  };
}
