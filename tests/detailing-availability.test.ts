import { describe, expect, it } from 'vitest';
import { availableSlots, parisWallTimeToUtc } from '@/lib/detailing/availability';
import type { AvailabilityConfig, TimeRange } from '@/lib/detailing/types';

/** Le lendemain, à minuit — un jour toujours dans le futur, quelle que soit la date d'exécution. */
function tomorrow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Même conversion « heure murale Europe/Paris → instant UTC » que le moteur
 * (`atTime`, interne à `availability.ts`) — réutilise `parisWallTimeToUtc`
 * plutôt que de dupliquer la logique, pour que ce fichier ne puisse pas
 * rester vert par erreur si le comportement réel change (17/09/2026,
 * correctif du décalage horaire).
 */
function at(day: Date, hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return parisWallTimeToUtc(day.getFullYear(), day.getMonth() + 1, day.getDate(), hours ?? 0, minutes ?? 0);
}

/*
 * Cette machine de test tourne elle-même en Europe/Paris (confirmé,
 * 17/09/2026) : une comparaison entre deux appels de `parisWallTimeToUtc` ne
 * peut donc pas trahir un bug de fuseau, les deux hériteraient de la même
 * erreur. Ces deux cas fixent l'instant UTC attendu en dur (calculé à la
 * main), pour rester valables même si les tests tournent un jour sur un
 * serveur en UTC — ce qui est le cas de l'hébergement de production, et la
 * cause du décalage de 2h que Dorian a observé sur Auto Clean Pro avant ce
 * correctif.
 */
describe('parisWallTimeToUtc — indépendant du fuseau de la machine qui exécute les tests', () => {
  it('convertit 16h30 Paris un jour d’été (CEST, UTC+2) en 14h30 UTC', () => {
    const result = parisWallTimeToUtc(2026, 9, 29, 16, 30);
    expect(result.toISOString()).toBe('2026-09-29T14:30:00.000Z');
  });

  it('convertit 16h30 Paris un jour d’hiver (CET, UTC+1) en 15h30 UTC', () => {
    const result = parisWallTimeToUtc(2026, 1, 15, 16, 30);
    expect(result.toISOString()).toBe('2026-01-15T15:30:00.000Z');
  });
});

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

/**
 * Cas Auto Clean Pro (17/09/2026) : deux interventions fixes par jour,
 * 16h30 et 17h45, quelle que soit la durée choisie par le client.
 */
describe('availableSlots — plafond quotidien de créneaux', () => {
  const baseConfig: AvailabilityConfig = {
    weekly: [{ weekday: 0, opensAt: '16:30', closesAt: '22:00', bufferMinutes: 15 }],
    closures: [],
    minBookingNoticeHours: 0,
    slotGranularityMinutes: 75,
    maxDailySlots: 2,
  };

  it('ne propose jamais plus que le plafond, même pour une prestation courte', () => {
    const day = tomorrow();
    const config: AvailabilityConfig = { ...baseConfig, weekly: [{ ...baseConfig.weekly[0]!, weekday: day.getDay() }] };

    // Une prestation de 30 minutes (ex. formule moto) laisserait apparaître
    // un troisième créneau (19:00, 20:15…) sans le plafond.
    const slots = availableSlots(day, 30, config, []);

    expect(slots).toHaveLength(2);
    expect(slots[0]!.start).toEqual(at(day, '16:30'));
    expect(slots[1]!.start).toEqual(at(day, '17:45'));
  });

  it('respecte toujours la durée réelle pour les créneaux qu’il garde', () => {
    const day = tomorrow();
    const config: AvailabilityConfig = { ...baseConfig, weekly: [{ ...baseConfig.weekly[0]!, weekday: day.getDay() }] };

    // Prestation longue (2 h) : les deux créneaux gardés tiennent toujours
    // avant la fermeture.
    const slots = availableSlots(day, 120, config, []);

    expect(slots).toHaveLength(2);
    expect(slots[1]!.end.getHours()).toBeLessThanOrEqual(22);
  });

  it('n’ajoute pas de créneau qui n’existerait pas sans plafond', () => {
    const day = tomorrow();
    // Fenêtre trop courte pour un deuxième créneau, plafond à 2 malgré tout.
    const config: AvailabilityConfig = {
      ...baseConfig,
      weekly: [{ weekday: day.getDay(), opensAt: '16:30', closesAt: '17:00', bufferMinutes: 15 }],
    };

    expect(availableSlots(day, 30, config, [])).toHaveLength(1);
  });
});
