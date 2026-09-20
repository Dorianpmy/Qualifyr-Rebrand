import { describe, expect, it } from 'vitest';
import {
  SCOPE_DISPLAY_ORDER,
  calendarDayDescription,
  monthlyCalendar,
  type CalendarDay,
} from '@/lib/detailing/calendar';
import type { DashboardBooking } from '@/lib/detailing/dashboard';
import { parisWallTimeToUtc } from '@/lib/detailing/availability';

/**
 * Un créneau `tstzrange`-like minimal, à l'heure murale Europe/Paris donnée —
 * même conversion que le moteur de créneaux (`parisWallTimeToUtc`), pour que
 * ce fichier ne dépende pas du fuseau de la machine qui exécute les tests.
 */
function slotAt(year: number, month: number, day: number, hour: number): string {
  const start = parisWallTimeToUtc(year, month, day, hour, 0).toISOString();
  const end = parisWallTimeToUtc(year, month, day, hour + 1, 0).toISOString();
  return `["${start}","${end}")`;
}

function booking(overrides: Partial<DashboardBooking>): DashboardBooking {
  return {
    id: 'b1',
    status: 'confirme',
    email: 'client@example.com',
    phone: null,
    vehicleSize: 'berline',
    vehicleModel: null,
    plate: null,
    scope: 'interieur',
    soiling: 'normal',
    locationMode: 'atelier',
    postalCode: null,
    quotedPrice: 50,
    quotedMinutes: 60,
    depositAmount: 15,
    photos: [],
    slotRaw: slotAt(2026, 9, 17, 10),
    createdAt: '2026-09-01T00:00:00.000Z',
    holdExpiresAt: null,
    address: null,
    latitude: null,
    longitude: null,
    accessNote: null,
    ...overrides,
  };
}

// Le 15 septembre 2026 à midi UTC : à l'intérieur du mois testé, loin de
// minuit et de tout changement d'heure, pour que `referenceDate` ne dépende
// d'aucun fuseau.
const REFERENCE = new Date('2026-09-15T12:00:00.000Z');

describe('monthlyCalendar', () => {
  it('libelle le mois en français, capitalisé', () => {
    const calendar = monthlyCalendar([], REFERENCE);
    expect(calendar.monthLabel).toBe('Septembre 2026');
  });

  it('aligne le premier jour du mois sur la semaine française (lundi = colonne 0)', () => {
    const calendar = monthlyCalendar([], REFERENCE);
    const firstDay = calendar.weeks.flat().find((day) => day.isCurrentMonth && day.dayOfMonth === 1);
    expect(firstDay).toBeDefined();

    const indexInGrid = calendar.weeks.flat().findIndex((day) => day === firstDay);
    // Lundi = 0 … dimanche = 6, calculé indépendamment de `mondayIndex`.
    const utcWeekday = new Date(Date.UTC(2026, 8, 1)).getUTCDay(); // 0 = dimanche
    const expectedMondayIndex = (utcWeekday + 6) % 7;
    expect(indexInGrid % 7).toBe(expectedMondayIndex);
  });

  it('chaque semaine compte exactement sept cases', () => {
    const calendar = monthlyCalendar([], REFERENCE);
    for (const week of calendar.weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it('associe une réservation active à son jour, avec la bonne prestation', () => {
    const calendar = monthlyCalendar(
      [booking({ scope: 'exterieur', slotRaw: slotAt(2026, 9, 17, 10) })],
      REFERENCE,
    );
    const day17 = calendar.weeks.flat().find((d) => d.isCurrentMonth && d.dayOfMonth === 17) as CalendarDay;
    expect(day17.count).toBe(1);
    expect(day17.scopes).toEqual(['exterieur']);
  });

  it('trie les prestations d’un même jour selon SCOPE_DISPLAY_ORDER, sans doublon', () => {
    const calendar = monthlyCalendar(
      [
        booking({ id: 'b1', scope: 'complet', slotRaw: slotAt(2026, 9, 17, 9) }),
        booking({ id: 'b2', scope: 'interieur', slotRaw: slotAt(2026, 9, 17, 11) }),
        booking({ id: 'b3', scope: 'complet', slotRaw: slotAt(2026, 9, 17, 14) }),
      ],
      REFERENCE,
    );
    const day17 = calendar.weeks.flat().find((d) => d.isCurrentMonth && d.dayOfMonth === 17) as CalendarDay;
    expect(day17.count).toBe(3);
    expect(day17.scopes).toEqual(
      SCOPE_DISPLAY_ORDER.filter((s) => s === 'interieur' || s === 'complet'),
    );
  });

  it('exclut les réservations annulées ou expirées', () => {
    const calendar = monthlyCalendar(
      [
        booking({ id: 'b1', status: 'annule', slotRaw: slotAt(2026, 9, 17, 10) }),
        booking({ id: 'b2', status: 'expire', slotRaw: slotAt(2026, 9, 18, 10) }),
      ],
      REFERENCE,
    );
    const day17 = calendar.weeks.flat().find((d) => d.isCurrentMonth && d.dayOfMonth === 17) as CalendarDay;
    const day18 = calendar.weeks.flat().find((d) => d.isCurrentMonth && d.dayOfMonth === 18) as CalendarDay;
    expect(day17.count).toBe(0);
    expect(day18.count).toBe(0);
  });

  it('ignore les réservations d’un autre mois', () => {
    const calendar = monthlyCalendar(
      [booking({ slotRaw: slotAt(2026, 10, 3, 10) })],
      REFERENCE,
    );
    const total = calendar.weeks.flat().reduce((sum, d) => sum + d.count, 0);
    expect(total).toBe(0);
  });

  it('marque isToday uniquement quand la date de référence tombe ce jour-là', () => {
    const calendar = monthlyCalendar([], REFERENCE);
    const today = calendar.weeks.flat().filter((d) => d.isToday);
    expect(today).toHaveLength(1);
    expect(today[0]?.dayOfMonth).toBe(15);
  });
});

describe('calendarDayDescription', () => {
  it('décrit un jour sans réservation', () => {
    const day: CalendarDay = {
      dateKey: '2026-09-17',
      dayOfMonth: 17,
      isCurrentMonth: true,
      isToday: false,
      scopes: [],
      count: 0,
    };
    expect(calendarDayDescription(day, 'Septembre 2026')).toBe('17 septembre — aucune réservation');
  });

  it('décrit un jour avec plusieurs réservations et prestations, au pluriel', () => {
    const day: CalendarDay = {
      dateKey: '2026-09-17',
      dayOfMonth: 17,
      isCurrentMonth: true,
      isToday: false,
      scopes: ['interieur', 'complet'],
      count: 2,
    };
    expect(calendarDayDescription(day, 'Septembre 2026')).toBe(
      '17 septembre — 2 réservations : Intérieur, Complet',
    );
  });

  it('signale le jour courant', () => {
    const day: CalendarDay = {
      dateKey: '2026-09-15',
      dayOfMonth: 15,
      isCurrentMonth: true,
      isToday: true,
      scopes: ['exterieur'],
      count: 1,
    };
    expect(calendarDayDescription(day, 'Septembre 2026')).toBe(
      '15 septembre (aujourd’hui) — 1 réservation : Extérieur',
    );
  });

  it('renvoie une chaîne vide pour une case hors mois', () => {
    const day: CalendarDay = {
      dateKey: '',
      dayOfMonth: 0,
      isCurrentMonth: false,
      isToday: false,
      scopes: [],
      count: 0,
    };
    expect(calendarDayDescription(day, 'Septembre 2026')).toBe('');
  });
});
