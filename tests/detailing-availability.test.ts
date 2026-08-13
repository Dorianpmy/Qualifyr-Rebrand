import { describe, expect, it } from 'vitest';
import { availableSlots } from '@/lib/detailing/availability';
import type { AvailabilityConfig, TimeRange } from '@/lib/detailing/types';

/** Le lendemain, à minuit — un jour toujours dans le futur, quelle que soit la date d'exécution. */
function tomorrow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function at(day: Date, hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const result = new Date(day);
  result.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return result;
}

describe('availableSlots — découpe de l’amplitude', () => {
  it('propose des créneaux espacés de la granularité réglée, sans dépasser la fermeture', () => {
    const day = tomorrow();
    const config: AvailabilityConfig = {
      weekly: [{ weekday: day.getDay(), opensAt: '09:00', closesAt: '12:00', bufferMinutes: 15 }],
      closures: [],
      minBookingNoticeHours: 0,
      slotGranularityMinutes: 30,
    };

    const slots = availableSlots(day, 60, config, []);

    expect(slots).toHaveLength(5);
    expect(slots[0]!.start).toEqual(at(day, '09:00'));
    expect(slots.at(-1)!.start).toEqual(at(day, '11:00'));
    expect(slots.at(-1)!.end).toEqual(at(day, '12:00'));
  });

  it('ne propose rien un jour fermé', () => {
    const day = tomorrow();
    const config: AvailabilityConfig = {
      weekly: [{ weekday: (day.getDay() + 1) % 7, opensAt: '09:00', closesAt: '18:00', bufferMinutes: 15 }],
      closures: [],
      minBookingNoticeHours: 0,
      slotGranularityMinutes: 30,
    };

    expect(availableSlots(day, 60, config, [])).toEqual([]);
  });

  it('ne propose rien quand la durée dépasse l’amplitude d’ouverture', () => {
    const day = tomorrow();
    const config: AvailabilityConfig = {
      weekly: [{ weekday: day.getDay(), opensAt: '09:00', closesAt: '10:00', bufferMinutes: 0 }],
      closures: [],
      minBookingNoticeHours: 0,
      slotGranularityMinutes: 30,
    };

    expect(availableSlots(day, 120, config, [])).toEqual([]);
  });
});

describe('availableSlots — réservations existantes et battement', () => {
  it('retire les créneaux qui chevauchent une réservation, battement compris', () => {
    const day = tomorrow();
    const config: AvailabilityConfig = {
      weekly: [{ weekday: day.getDay(), opensAt: '09:00', closesAt: '12:00', bufferMinutes: 15 }],
      closures: [],
      minBookingNoticeHours: 0,
      slotGranularityMinutes: 30,
    };
    const booked: readonly TimeRange[] = [{ start: at(day, '10:00'), end: at(day, '10:30') }];

    const slots = availableSlots(day, 60, config, booked);

    // Réservation 10:00-10:30 + battement 15 min de chaque côté = 09:45-10:45 bloqué.
    expect(slots).toHaveLength(1);
    expect(slots[0]!.start).toEqual(at(day, '11:00'));
  });
});

describe('availableSlots — délai minimal de réservation', () => {
  it('exclut tous les créneaux quand le délai minimal dépasse le jour demandé', () => {
    const day = tomorrow();
    const config: AvailabilityConfig = {
      weekly: [{ weekday: day.getDay(), opensAt: '09:00', closesAt: '18:00', bufferMinutes: 15 }],
      closures: [],
      minBookingNoticeHours: 48,
      slotGranularityMinutes: 30,
    };

    expect(availableSlots(day, 60, config, [])).toEqual([]);
  });
});
