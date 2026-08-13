import { availableSlots } from './availability';
import { loadDetailerBySlug } from './config';
import { getServiceSupabaseClient } from './supabase-server';
import type { TimeRange } from './types';

const ACTIVE_STATUSES = ['en_attente_paiement', 'confirme', 'ajuste'];

/**
 * Un `tstzrange` Postgres arrive sous forme de littéral, ex.
 * `["2026-08-20 09:00:00+00","2026-08-20 12:00:00+00")`. On ne le reçoit
 * jamais que tel que ce module l'a lui-même écrit (`booking.ts`), donc un
 * découpage simple suffit sans dépendance de parsing supplémentaire.
 */
function parsePgRange(raw: string): TimeRange {
  const inner = raw.slice(1, -1);
  const [startRaw, endRaw] = inner.split(',');
  const unquote = (value: string) => value.replace(/^"|"$/g, '');
  return {
    start: new Date(unquote(startRaw ?? '')),
    end: new Date(unquote(endRaw ?? '')),
  };
}

export type SlotsForDayResult =
  | { readonly ok: true; readonly slots: readonly TimeRange[] }
  | { readonly ok: false; readonly reason: 'not_configured' | 'detailer_not_found' };

/**
 * Créneaux disponibles pour un professionnel, un jour et une durée déjà
 * calculée par le moteur de devis (`quote.ts`).
 *
 * Le jour est interprété dans le fuseau horaire du serveur qui exécute cette
 * fonction, comme `availableSlots` lui-même : les professionnels visés
 * exercent en France, une gestion multi-fuseau n'apporte rien ici.
 */
export async function slotsForDay(
  slug: string,
  day: Date,
  durationMinutes: number,
): Promise<SlotsForDayResult> {
  const detailer = await loadDetailerBySlug(slug);
  if (!detailer) return { ok: false, reason: 'detailer_not_found' };

  const client = getServiceSupabaseClient();
  if (!client) return { ok: false, reason: 'not_configured' };

  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const { data } = await client
    .from('detailer_bookings')
    .select('slot')
    .eq('detailer_id', detailer.id)
    .in('status', ACTIVE_STATUSES)
    .filter('slot', 'ov', `[${dayStart.toISOString()},${dayEnd.toISOString()})`);

  const booked = (data ?? []).map((row) => parsePgRange(row.slot as string));

  const slots = availableSlots(dayStart, durationMinutes, detailer.availabilityConfig, booked);
  return { ok: true, slots };
}
