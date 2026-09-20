/**
 * Calendrier et vocabulaire des prestations — logique pure.
 *
 * **Volontairement séparé de `dashboard.ts`.** Ce dernier porte
 * `import 'server-only'` (accès Supabase), ce qui empêche d'importer quoi
 * que ce soit du fichier depuis un test — même une fonction qui ne touche à
 * aucune base. Ce module ne dépend que de `types.ts` et de `Intl` : il peut
 * tourner n'importe où, exactement comme `availability.ts` et `quote.ts`.
 * `dashboard.ts` réexporte `scopeLabel` pour ne rien changer aux imports
 * existants ; `slotStart` n'était utilisé qu'en interne et l'est resté,
 * simplement importé d'ici.
 */

import type { DashboardBooking } from './dashboard';

export function scopeLabel(scope: string): string {
  const map: Record<string, string> = {
    interieur: 'Intérieur',
    exterieur: 'Extérieur',
    complet: 'Complet',
  };
  return map[scope] ?? scope;
}

/** Début d'un créneau `tstzrange` Postgres (`["2026-08-13 10:00:00+00",…)`), ou `null`. */
export function slotStart(slotRaw: string | null): Date | null {
  if (!slotRaw) return null;
  const match = slotRaw.match(/\["?([^,"\]]+)/);
  if (!match?.[1]) return null;
  const date = new Date(match[1].replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
}

/* =========================================================================
   Aperçu mensuel — page Demandes (20 septembre 2026)
   -------------------------------------------------------------------------
   Demande de Dorian : un mini-calendrier du mois, avec une couleur par
   prestation (`scope`). `scope` est une énumération fixe à trois valeurs
   (`types.ts`) — pas un catalogue libre par professionnel — donc une palette
   à trois teintes suffit, sans mécanisme d'assignation dynamique.

   **Les trois couleurs ne sont pas nouvelles.** Elles reprennent le contour
   « tricolore » déjà utilisé dans ce même dashboard (onglet actif, carte
   d'activation du paiement, écran de connexion — voir la note du
   12/09/2026 dans `app.module.css`) : pêche (`--accent-1`), terracotta
   (`#c9835c`) et laiton (`#c7a06b`). Les trois restent chaudes — la charte
   interdit tout dégradé froid — et introduire une quatrième identité de
   couleur pour le même produit aurait dilué un repère déjà appris.
   ========================================================================= */

/** Ordre d'affichage stable des prestations — légende et puces du calendrier. */
export const SCOPE_DISPLAY_ORDER: readonly string[] = ['interieur', 'exterieur', 'complet'];

const PARIS_DATE_KEY = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' });

/** `YYYY-MM-DD` en heure de Paris — même repère que `listBookingsForDay`. */
function parisDateKey(date: Date): string {
  return PARIS_DATE_KEY.format(date);
}

export type CalendarDay = {
  /** `YYYY-MM-DD` ; vide pour une case de remplissage hors mois. */
  readonly dateKey: string;
  readonly dayOfMonth: number;
  readonly isCurrentMonth: boolean;
  readonly isToday: boolean;
  /** Prestations distinctes ce jour-là, triées selon `SCOPE_DISPLAY_ORDER`. */
  readonly scopes: readonly string[];
  /** Réservations actives ce jour-là (annulées et expirées exclues). */
  readonly count: number;
};

export type MonthlyCalendar = {
  /** Ex. « Septembre 2026 », déjà capitalisé. */
  readonly monthLabel: string;
  readonly weeks: readonly (readonly CalendarDay[])[];
};

const WEEKDAY_SHORT_EN = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Paris',
  weekday: 'short',
});

/** Index lundi = 0 … dimanche = 6, pour aligner la grille sur la semaine française. */
function mondayIndex(date: Date): number {
  const order: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return order[WEEKDAY_SHORT_EN.format(date)] ?? 0;
}

function capitalize(text: string): string {
  return text.length === 0 ? text : text[0]!.toUpperCase() + text.slice(1);
}

/**
 * Grille du mois de `referenceDate`, en heure de Paris.
 *
 * Ne regarde que les réservations dont le créneau tombe dans ce mois et dont
 * le statut n'est ni `annule` ni `expire` — un rendez-vous annulé ne
 * représente plus une intervention ce jour-là. Les cases hors mois
 * (avant le 1er, après le dernier jour) complètent la grille à des semaines
 * entières ; elles portent `isCurrentMonth: false` et aucune donnée.
 */
export function monthlyCalendar(
  bookings: readonly DashboardBooking[],
  referenceDate: Date = new Date(),
): MonthlyCalendar {
  const todayKey = parisDateKey(referenceDate);
  const [refYear, refMonth] = parisDateKey(referenceDate).split('-').map(Number) as [
    number,
    number,
  ];

  const scopesByDay = new Map<string, Set<string>>();
  const countByDay = new Map<string, number>();
  const monthPrefix = `${String(refYear).padStart(4, '0')}-${String(refMonth).padStart(2, '0')}`;

  for (const booking of bookings) {
    if (booking.status === 'annule' || booking.status === 'expire') continue;
    const start = slotStart(booking.slotRaw);
    if (!start) continue;
    const key = parisDateKey(start);
    if (!key.startsWith(monthPrefix)) continue;
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
    const scopes = scopesByDay.get(key) ?? new Set<string>();
    scopes.add(booking.scope);
    scopesByDay.set(key, scopes);
  }

  const firstOfMonth = new Date(Date.UTC(refYear, refMonth - 1, 1, 12));
  const daysInMonth = new Date(Date.UTC(refYear, refMonth, 0)).getUTCDate();
  const leadingBlanks = mondayIndex(firstOfMonth);

  const blank = (): CalendarDay => ({
    dateKey: '',
    dayOfMonth: 0,
    isCurrentMonth: false,
    isToday: false,
    scopes: [],
    count: 0,
  });

  const days: CalendarDay[] = [];
  for (let i = 0; i < leadingBlanks; i += 1) days.push(blank());

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${monthPrefix}-${String(day).padStart(2, '0')}`;
    const scopeSet = scopesByDay.get(key);
    days.push({
      dateKey: key,
      dayOfMonth: day,
      isCurrentMonth: true,
      isToday: key === todayKey,
      scopes: scopeSet ? SCOPE_DISPLAY_ORDER.filter((scope) => scopeSet.has(scope)) : [],
      count: countByDay.get(key) ?? 0,
    });
  }

  while (days.length % 7 !== 0) days.push(blank());

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const monthLabel = capitalize(
    new Intl.DateTimeFormat('fr-FR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Paris',
    }).format(new Date(Date.UTC(refYear, refMonth - 1, 15, 12))),
  );

  return { monthLabel, weeks };
}

/**
 * Description lisible d'une case du calendrier — portée par un texte
 * accessible, jamais par la couleur seule (docs/03 §7 : « aucune icône ne
 * porte seule une information »). Sert à la fois d'infobulle (`title`) et de
 * texte pour lecteur d'écran.
 */
export function calendarDayDescription(day: CalendarDay, monthLabel: string): string {
  if (!day.isCurrentMonth) return '';
  const monthName = monthLabel.split(' ')[0]?.toLowerCase() ?? '';
  const base = `${day.dayOfMonth} ${monthName}${day.isToday ? ' (aujourd’hui)' : ''}`;
  if (day.count === 0) return `${base} — aucune réservation`;
  const scopeNames = day.scopes.map(scopeLabel).join(', ');
  return `${base} — ${day.count} réservation${day.count > 1 ? 's' : ''} : ${scopeNames}`;
}
