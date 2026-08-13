/**
 * Moteur de créneaux — pur, synchrone, sans dépendance React ni Supabase.
 *
 * Découpe l'amplitude d'ouverture d'un jour donné, retire les réservations
 * existantes, les fermetures ponctuelles, applique le battement entre deux
 * interventions et le délai minimal de réservation.
 *
 * La durée vient du moteur de devis (`quote.ts`) : un client qui a choisi
 * quatre heures d'options ne voit que les créneaux où quatre heures tiennent
 * (`docs/13-saas-nettoyage-automobile.md`, §2.6).
 */

import type { AvailabilityConfig, TimeRange } from './types';

function atTime(day: Date, hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const result = new Date(day);
  result.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return result;
}

function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && a.end > b.start;
}

/** Étend un intervalle occupé du battement réglé par le professionnel, des deux côtés. */
function withBuffer(range: TimeRange, bufferMinutes: number): TimeRange {
  return {
    start: new Date(range.start.getTime() - bufferMinutes * 60_000),
    end: new Date(range.end.getTime() + bufferMinutes * 60_000),
  };
}

/**
 * Créneaux disponibles pour un jour donné et une durée déjà calculée.
 *
 * `booked` doit contenir les réservations existantes de ce professionnel,
 * quel que soit le jour — la fonction ne retient que celles qui touchent le
 * jour demandé.
 */
export function availableSlots(
  day: Date,
  durationMinutes: number,
  config: AvailabilityConfig,
  booked: readonly TimeRange[],
): readonly TimeRange[] {
  const weekday = config.weekly.find((entry) => entry.weekday === day.getDay());
  if (!weekday || durationMinutes <= 0) return [];

  const opensAt = atTime(day, weekday.opensAt);
  const closesAt = atTime(day, weekday.closesAt);
  if (closesAt <= opensAt) return [];

  const dayWindow: TimeRange = { start: opensAt, end: closesAt };

  const closureRanges: readonly TimeRange[] = config.closures
    .map((closure) => ({ start: closure.startsAt, end: closure.endsAt }))
    .filter((range) => overlaps(range, dayWindow));

  const bookedRanges: readonly TimeRange[] = booked
    .filter((range) => overlaps(range, dayWindow))
    .map((range) => withBuffer(range, weekday.bufferMinutes));

  const blocked: readonly TimeRange[] = [...closureRanges, ...bookedRanges];

  const earliestStart = new Date(Date.now() + config.minBookingNoticeHours * 3_600_000);
  const step = Math.max(config.slotGranularityMinutes, 1) * 60_000;
  const durationMs = durationMinutes * 60_000;

  const slots: TimeRange[] = [];
  for (
    let start = opensAt.getTime();
    start + durationMs <= closesAt.getTime();
    start += step
  ) {
    const candidate: TimeRange = { start: new Date(start), end: new Date(start + durationMs) };
    if (candidate.start < earliestStart) continue;
    if (blocked.some((range) => overlaps(candidate, range))) continue;
    slots.push(candidate);
  }

  return slots;
}
