import 'server-only';
import { getServiceSupabaseClient } from './supabase-server';
import type { BookingStatus } from './types';

export type DashboardBooking = {
  readonly id: string;
  readonly status: BookingStatus | string;
  readonly email: string;
  readonly phone: string | null;
  readonly vehicleSize: string;
  readonly vehicleModel: string | null;
  readonly plate: string | null;
  readonly scope: string;
  readonly soiling: string;
  readonly locationMode: string;
  readonly postalCode: string | null;
  readonly quotedPrice: number;
  readonly quotedMinutes: number;
  readonly depositAmount: number;
  readonly photos: readonly string[];
  readonly slotRaw: string | null;
  readonly createdAt: string;
  readonly holdExpiresAt: string | null;
};

export type DashboardDetailer = {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly email: string | null;
  readonly city: string | null;
};

function mapBooking(row: Record<string, unknown>): DashboardBooking {
  return {
    id: String(row.id),
    status: String(row.status),
    email: String(row.email),
    phone: (row.phone as string | null) ?? null,
    vehicleSize: String(row.vehicle_size),
    vehicleModel: (row.vehicle_model as string | null) ?? null,
    plate: (row.plate as string | null) ?? null,
    scope: String(row.scope),
    soiling: String(row.soiling),
    locationMode: String(row.location_mode),
    postalCode: (row.postal_code as string | null) ?? null,
    quotedPrice: Number(row.quoted_price),
    quotedMinutes: Number(row.quoted_minutes),
    depositAmount: Number(row.deposit_amount),
    photos: Array.isArray(row.photos) ? (row.photos as string[]) : [],
    slotRaw: (row.slot as string | null) ?? null,
    createdAt: String(row.created_at ?? ''),
    holdExpiresAt: (row.hold_expires_at as string | null) ?? null,
  };
}

/** Charge la fiche detailer liée à un user Auth (owner_id). */
export async function getDetailerForOwner(ownerId: string): Promise<DashboardDetailer | null> {
  const client = getServiceSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('detailers')
    .select('id, slug, name, email, city')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    slug: data.slug as string,
    name: data.name as string,
    email: (data.email as string | null) ?? null,
    city: (data.city as string | null) ?? null,
  };
}

/** Liste les réservations d'un detailer, plus récentes d'abord. */
export async function listBookingsForDetailer(
  detailerId: string,
  status?: string,
): Promise<readonly DashboardBooking[]> {
  const client = getServiceSupabaseClient();
  if (!client) return [];

  let query = client
    .from('detailer_bookings')
    .select('*')
    .eq('detailer_id', detailerId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((row) => mapBooking(row as Record<string, unknown>));
}

export async function getBookingForDetailer(
  detailerId: string,
  bookingId: string,
): Promise<DashboardBooking | null> {
  const client = getServiceSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('detailer_bookings')
    .select('*')
    .eq('detailer_id', detailerId)
    .eq('id', bookingId)
    .maybeSingle();

  if (error || !data) return null;
  return mapBooking(data as Record<string, unknown>);
}

const ALLOWED_STATUS: readonly BookingStatus[] = [
  'en_attente_paiement',
  'confirme',
  'ajuste',
  'realise',
  'annule',
  'expire',
];

export async function updateBookingStatus(
  detailerId: string,
  bookingId: string,
  status: BookingStatus,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!ALLOWED_STATUS.includes(status)) {
    return { ok: false, message: 'Statut non autorisé.' };
  }

  const client = getServiceSupabaseClient();
  if (!client) return { ok: false, message: 'Base de données indisponible.' };

  const { error } = await client
    .from('detailer_bookings')
    .update({ status })
    .eq('detailer_id', detailerId)
    .eq('id', bookingId);

  if (error) return { ok: false, message: 'Mise à jour impossible.' };
  return { ok: true };
}

export function formatSlot(slotRaw: string | null): string {
  if (!slotRaw) return '—';
  // Format Postgres tstzrange: ["2026-08-13 10:00:00+00","2026-08-13 12:00:00+00")
  const match = slotRaw.match(/\["?([^,"\]]+)/);
  if (!match?.[1]) return slotRaw;
  const date = new Date(match[1].replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return match[1];
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  }).format(date);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    en_attente_paiement: 'En attente',
    confirme: 'Confirmé',
    ajuste: 'Ajusté',
    realise: 'Réalisé',
    annule: 'Annulé',
    expire: 'Expiré',
  };
  return map[status] ?? status;
}
