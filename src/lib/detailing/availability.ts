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

const PARIS_TIME_ZONE = 'Europe/Paris';

/**
 * Décalage réel (en ms) entre UTC et « Europe/Paris » pour l'instant donné —
 * +1h en hiver (CET), +2h en été (CEST). Calculé sans dépendance externe : on
 * demande à `Intl.DateTimeFormat` ce que Paris afficherait pour cet instant,
 * puis on compare au même instant lu comme s'il était déjà UTC.
 */
function parisOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PARIS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const impliedUtcMs = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return impliedUtcMs - utcMs;
}

/**
 * Convertit une heure murale « Europe/Paris » (celle que le professionnel
 * règle dans Horaires, celle que son client lit sur son téléphone) en
 * l'instant UTC réel qu'elle représente.
 *
 * Avant ce correctif, `atTime` lisait `hh:mm` avec `Date.prototype.setHours`,
 * qui l'interprète dans le fuseau **du serveur qui exécute le code** — UTC
 * sur l'hébergement utilisé ici, jamais explicitement « Europe/Paris ». Un
 * professionnel réglant 16h30 obtenait donc un instant lu à tort comme
 * « 16h30 UTC », qu'un navigateur français (UTC+2 en septembre) affichait
 * ensuite correctement... 2 heures plus tard, soit 18h30. Confirmé par
 * Dorian sur Auto Clean Pro (16h30/17h45 réglés, 18h30/19h45 affichés,
 * 17/09/2026). Un décalage identique touchait très probablement tous les
 * professionnels ayant déjà utilisé l'écran Horaires.
 */
export function parisWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
): Date {
  const naiveUtcMs = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  const offsetMs = parisOffsetMs(naiveUtcMs);
  return new Date(naiveUtcMs - offsetMs);
}

function atTime(day: Date, hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return parisWallTimeToUtc(
    day.getFullYear(),
    day.getMonth() + 1,
    day.getDate(),
    hours ?? 0,
    minutes ?? 0,
  );
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

  // Plafond volontaire, indépendant de la durée demandée : un professionnel
  // qui ne veut que deux interventions par jour ne doit pas en voir une
  // troisième apparaître simplement parce qu'un client a choisi une
  // prestation plus courte qu'une autre (17/09/2026).
  if (config.maxDailySlots != null && config.maxDailySlots >= 0) {
    return slots.slice(0, config.maxDailySlots);
  }

  return slots;
}
