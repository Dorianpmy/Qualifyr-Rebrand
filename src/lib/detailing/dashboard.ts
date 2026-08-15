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
  readonly address: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly accessNote: string | null;
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
    address: (row.address as string | null) ?? null,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    accessNote: (row.access_note as string | null) ?? null,
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

/* =========================================================================
   Vocabulaire de l'espace professionnel
   -------------------------------------------------------------------------
   Le tableau affichait `citadine` et `complet` — les valeurs brutes de
   l'énumération SQL. C'est le détail qui fait dire « ce n'est pas fini »,
   plus sûrement que n'importe quel choix de couleur.

   Ces libellés sont volontairement courts : ils vivent dans une ligne de
   tableau, pas dans une phrase.
   ========================================================================= */

export function vehicleSizeLabel(size: string): string {
  const map: Record<string, string> = {
    citadine: 'Citadine',
    berline: 'Berline',
    suv: 'SUV',
    utilitaire: 'Utilitaire',
    prestige: 'Prestige',
  };
  return map[size] ?? size;
}

export function scopeLabel(scope: string): string {
  const map: Record<string, string> = {
    interieur: 'Intérieur',
    exterieur: 'Extérieur',
    complet: 'Complet',
  };
  return map[scope] ?? scope;
}

/**
 * État déclaré par le client.
 *
 * Formulé du point de vue du professionnel qui prépare son intervention,
 * pas du client qui remplit un formulaire : « poils et taches » lui dit
 * quel matériel sortir.
 */
export function soilingLabel(soiling: string): string {
  const map: Record<string, string> = {
    normal: 'Normal',
    tres_sale: 'Très sale',
    poils_taches: 'Poils et taches',
  };
  return map[soiling] ?? soiling;
}

export function locationLabel(mode: string, postalCode: string | null): string {
  if (mode === 'atelier') return 'Atelier';
  return postalCode ? `Domicile · ${postalCode}` : 'Domicile';
}

/**
 * Durée d'intervention, lisible d'un coup d'œil.
 *
 * C'est la contrainte réelle du métier — un detailer est limité par ses
 * créneaux, pas par la demande — et elle n'apparaissait nulle part alors
 * que `quotedMinutes` est en base depuis le début.
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '—';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${String(rest).padStart(2, '0')}`;
}

/**
 * Identité du véhicule, telle qu'un professionnel la nomme.
 *
 * Il ne pense pas « jean@gmail.com », il pense « le SUV noir de 14 h,
 * plaque AB-123-CD ». La plaque était en base et n'apparaissait nulle part.
 */
export function vehicleLabel(booking: {
  vehicleSize: string;
  vehicleModel: string | null;
  plate: string | null;
}): string {
  const parts = [vehicleSizeLabel(booking.vehicleSize)];
  if (booking.vehicleModel) parts.push(booking.vehicleModel);
  if (booking.plate) parts.push(booking.plate.toUpperCase());
  return parts.join(' · ');
}

/** Heure seule : la date est portée par le groupe de jour qui précède. */
export function formatSlotTime(slotRaw: string | null): string {
  const start = slotStart(slotRaw);
  if (!start) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  }).format(start);
}

export function slotStart(slotRaw: string | null): Date | null {
  if (!slotRaw) return null;
  const match = slotRaw.match(/\["?([^,"\]]+)/);
  if (!match?.[1]) return null;
  const date = new Date(match[1].replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Compte à rebours d'une réservation en attente de paiement.
 *
 * L'information la plus urgente de l'écran, et la seule qui n'y figurait
 * pas : ces réservations tiennent un créneau pendant quinze minutes puis
 * le libèrent. Retourne `null` dès qu'il n'y a plus rien à surveiller.
 */
export function holdRemaining(holdExpiresAt: string | null, now: Date = new Date()): string | null {
  if (!holdExpiresAt) return null;
  const expiry = new Date(holdExpiresAt);
  if (Number.isNaN(expiry.getTime())) return null;

  const seconds = Math.round((expiry.getTime() - now.getTime()) / 1000);
  if (seconds <= 0) return 'Expiré';
  if (seconds < 60) return 'Expire dans moins d’une minute';
  return `Expire dans ${Math.ceil(seconds / 60)} min`;
}
