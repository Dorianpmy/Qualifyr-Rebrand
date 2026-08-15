import { loadDetailerBySlug } from './config';
import { notifyBookingEmails } from './email';
import { quote } from './quote';
import { getServiceSupabaseClient } from './supabase-server';
import type { LocationMode, OptionKey, Scope, SoilingLevel, VehicleSize } from './types';

/**
 * Création d'une réservation — serveur uniquement.
 *
 * Le devis est recalculé ici à partir de la configuration du professionnel.
 * Après insert réussi : notifications email (client + detailer) en best-effort.
 */

export type CreateBookingInput = {
  readonly slug: string;
  readonly email: string;
  readonly phone?: string | undefined;
  readonly vehicleSize: VehicleSize;
  readonly vehicleModel?: string | undefined;
  readonly plate?: string | undefined;
  readonly scope: Scope;
  readonly soiling: SoilingLevel;
  readonly optionKeys: readonly OptionKey[];
  readonly locationMode: LocationMode;
  readonly postalCode?: string | undefined;
  readonly travelKm?: number | undefined;
  readonly address?: string | undefined;
  readonly latitude?: number | undefined;
  readonly longitude?: number | undefined;
  readonly accessNote?: string | undefined;
  readonly photos: readonly string[];
  readonly slotStart: string;
};

export type CreateBookingFailureReason =
  | 'not_configured'
  | 'detailer_not_found'
  | 'travel_out_of_range'
  | 'photos_required'
  | 'invalid_slot'
  | 'slot_taken'
  | 'unknown';

export type CreateBookingResult =
  | {
      readonly ok: true;
      readonly booking: {
        readonly id: string;
        readonly status: string;
        readonly quotedPrice: number;
        readonly quotedMinutes: number;
        readonly depositAmount: number;
        readonly holdExpiresAt: string;
      };
    }
  | { readonly ok: false; readonly reason: CreateBookingFailureReason; readonly message: string };

const HOLD_MINUTES = 15;
const EXCLUSION_VIOLATION = '23P01';

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const detailer = await loadDetailerBySlug(input.slug);
  if (!detailer) {
    return {
      ok: false,
      reason: 'detailer_not_found',
      message: 'Ce professionnel est introuvable ou n’a pas de page publiée.',
    };
  }

  /*
   * Les photos ne sont plus exigées.
   *
   * Ce garde-fou renvoyait « Trois photos sont nécessaires » à toute
   * réservation qui n'en portait pas trois — y compris celles que le
   * formulaire, qui les a rendues facultatives, acceptait d'envoyer. Le
   * risque couvert par les photos l'est autrement : le professionnel vérifie
   * le véhicule à son arrivée et peut proposer un montant ajusté, que le
   * client reste libre de refuser.
   */

  const computed = quote(
    {
      scope: input.scope,
      vehicleSize: input.vehicleSize,
      soiling: input.soiling,
      optionKeys: input.optionKeys,
      locationMode: input.locationMode,
      travelKm: input.travelKm,
    },
    detailer.quoteConfig,
  );

  if (!computed.travelAllowed) {
    return {
      ok: false,
      reason: 'travel_out_of_range',
      message: 'Ce professionnel ne se déplace pas encore jusqu’à cette distance.',
    };
  }

  const slotStart = new Date(input.slotStart);
  if (Number.isNaN(slotStart.getTime())) {
    return { ok: false, reason: 'invalid_slot', message: 'Le créneau choisi n’est plus valide.' };
  }
  const slotEnd = new Date(slotStart.getTime() + computed.totalMinutes * 60_000);

  const client = getServiceSupabaseClient();
  if (!client) {
    return {
      ok: false,
      reason: 'not_configured',
      message: 'La réservation n’est pas encore disponible.',
    };
  }

  const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60_000);

  const { data, error } = await client
    .from('detailer_bookings')
    .insert({
      detailer_id: detailer.id,
      email: input.email,
      phone: input.phone ?? null,
      vehicle_size: input.vehicleSize,
      vehicle_model: input.vehicleModel ?? null,
      plate: input.plate ?? null,
      scope: input.scope,
      soiling: input.soiling,
      options: computed.optionLines,
      location_mode: input.locationMode,
      postal_code: input.postalCode ?? null,
      address: input.address ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      access_note: input.accessNote ?? null,
      travel_fee: computed.travelFee,
      quoted_price: computed.totalPrice,
      quoted_minutes: computed.totalMinutes,
      deposit_amount: computed.depositAmount,
      photos: input.photos,
      slot: `[${slotStart.toISOString()},${slotEnd.toISOString()})`,
      status: 'en_attente_paiement',
      hold_expires_at: holdExpiresAt.toISOString(),
    })
    .select('id, status')
    .single();

  if (error || !data) {
    if (error?.code === EXCLUSION_VIOLATION) {
      return {
        ok: false,
        reason: 'slot_taken',
        message: 'Ce créneau vient d’être pris. Choisissez-en un autre.',
      };
    }
    return {
      ok: false,
      reason: 'unknown',
      message: 'La réservation n’a pas pu être enregistrée.',
    };
  }

  const bookingId = data.id as string;

  // Best-effort : un échec d'email ne annule pas la réservation.
  void notifyBookingEmails({
    bookingId,
    detailerName: detailer.name,
    detailerEmail: detailer.email ?? null,
    clientEmail: input.email,
    clientPhone: input.phone,
    vehicleSize: input.vehicleSize,
    vehicleModel: input.vehicleModel,
    plate: input.plate,
    scope: input.scope,
    soiling: input.soiling,
    optionKeys: input.optionKeys,
    locationMode: input.locationMode,
    postalCode: input.postalCode,
    slotStart: input.slotStart,
    quotedPrice: computed.totalPrice,
    quotedMinutes: computed.totalMinutes,
    depositAmount: computed.depositAmount,
  });

  return {
    ok: true,
    booking: {
      id: bookingId,
      status: data.status as string,
      quotedPrice: computed.totalPrice,
      quotedMinutes: computed.totalMinutes,
      depositAmount: computed.depositAmount,
      holdExpiresAt: holdExpiresAt.toISOString(),
    },
  };
}
