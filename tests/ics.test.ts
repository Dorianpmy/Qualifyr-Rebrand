import { describe, expect, it } from 'vitest';
import { buildBookingIcs } from '@/lib/detailing/ics';

describe('buildBookingIcs', () => {
  it('produit un VEVENT valide avec les dates en UTC et la bonne durée', () => {
    const ics = buildBookingIcs({
      uid: 'booking-1',
      start: new Date('2026-09-24T10:00:00.000Z'),
      durationMinutes: 45,
      summary: 'Nettoyage auto — SW Carcleaning',
      description: 'Professionnel : SW Carcleaning',
      location: 'Domicile · 1700',
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:booking-1@qualifyragence.com');
    expect(ics).toContain('DTSTART:20260924T100000Z');
    // 10:00 + 45 min = 10:45.
    expect(ics).toContain('DTEND:20260924T104500Z');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('échappe les virgules, points-virgules et retours à la ligne dans le texte libre', () => {
    const ics = buildBookingIcs({
      uid: 'booking-2',
      start: new Date('2026-09-24T10:00:00.000Z'),
      durationMinutes: 30,
      summary: 'Nettoyage, extérieur; complet',
      description: 'Ligne 1\nLigne 2',
      location: 'Domicile · 1700',
    });

    expect(ics).toContain('SUMMARY:Nettoyage\\, extérieur\\; complet');
    expect(ics).toContain('DESCRIPTION:Ligne 1\\nLigne 2');
  });

  it('utilise des retours à la ligne CRLF, comme l’exige la norme', () => {
    const ics = buildBookingIcs({
      uid: 'booking-3',
      start: new Date('2026-09-24T10:00:00.000Z'),
      durationMinutes: 30,
      summary: 'Nettoyage auto',
      description: 'Détails',
      location: 'Atelier',
    });

    expect(ics).toContain('\r\n');
    expect(ics.split('\r\n').length).toBeGreaterThan(5);
  });
});
