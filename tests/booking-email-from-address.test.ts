import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Adresse d'expédition des e-mails de réservation.
 *
 * `BOOKING_FROM_EMAIL` absente en production envoyait quand même — Resend
 * acceptait `onboarding@resend.dev` sans erreur — mais ce domaine partagé ne
 * livre qu'au propriétaire du compte Resend : client et professionnel ne
 * recevaient jamais confirmation, notification ou relance, sans qu'aucune
 * erreur ne le signale nulle part (voir `fromAddress()` dans
 * `lib/detailing/email.ts`). Ce test verrouille les trois issues possibles :
 * refus explicite en production sans configuration, usage de la configuration
 * quand elle existe, repli uniquement hors production.
 */

const sendMock = vi.fn(async (_options: { readonly from: string; readonly to: string }) => ({
  data: { id: 'em_test' },
  error: null,
}));

vi.mock('resend', () => ({
  // Fonction classique, pas fléchée : `getResend()` construit avec `new
  // Resend(key)`, et une fonction fléchée n'est pas utilisable comme
  // constructeur.
  Resend: vi.fn().mockImplementation(function Resend() {
    return { emails: { send: sendMock } };
  }),
}));

function bookingPayload() {
  return {
    bookingId: 'booking-1',
    detailerName: 'Marc Dupuis',
    detailerEmail: 'marc@lavage-avignon.fr',
    clientEmail: 'client@example.fr',
    vehicleSize: 'citadine' as const,
    scope: 'complet' as const,
    soiling: 'normal' as const,
    optionKeys: [] as const,
    locationMode: 'atelier' as const,
    slotStart: new Date('2026-09-01T10:00:00Z').toISOString(),
    quotedPrice: 50,
    quotedMinutes: 30,
    depositAmount: 0,
  };
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  sendMock.mockClear();
  vi.stubEnv('RESEND_API_KEY', 'test-key');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('sendClientBookingEmail — adresse d’expédition', () => {
  it('refuse d’envoyer en production sans BOOKING_FROM_EMAIL, sans appeler Resend', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    const { sendClientBookingEmail } = await import('@/lib/detailing/email');

    const ok = await sendClientBookingEmail(bookingPayload());

    expect(ok).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('utilise BOOKING_FROM_EMAIL quand elle est configurée, même en production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('BOOKING_FROM_EMAIL', 'Qualifyr <contact@qualifyragence.com>');
    vi.resetModules();
    const { sendClientBookingEmail } = await import('@/lib/detailing/email');

    const ok = await sendClientBookingEmail(bookingPayload());

    expect(ok).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0]?.[0]?.from).toBe('Qualifyr <contact@qualifyragence.com>');
  });

  it('retombe sur un domaine de test hors production, jamais vers le silence', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.resetModules();
    const { sendClientBookingEmail } = await import('@/lib/detailing/email');

    const ok = await sendClientBookingEmail(bookingPayload());

    expect(ok).toBe(true);
    expect(sendMock.mock.calls[0]?.[0]?.from).toBe('Qualifyr <onboarding@resend.dev>');
  });
});

describe('sendDetailerBookingEmail — objet visible, devise et lien direct', () => {
  it('affiche le montant dans la devise du pays du professionnel, jamais toujours en EUR', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.resetModules();
    const { sendDetailerBookingEmail } = await import('@/lib/detailing/email');

    await sendDetailerBookingEmail({ ...bookingPayload(), country: 'CH', quotedPrice: 89 });

    const call = sendMock.mock.calls[0]?.[0] as unknown as { subject: string; text: string };
    expect(call.subject).toContain('CHF');
    expect(call.text).toContain('CHF');
    expect(call.subject).not.toMatch(/€/);
  });

  it("garde l'euro pour un professionnel français (comportement historique)", async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.resetModules();
    const { sendDetailerBookingEmail } = await import('@/lib/detailing/email');

    await sendDetailerBookingEmail({ ...bookingPayload(), country: 'FR', quotedPrice: 50 });

    const call = sendMock.mock.calls[0]?.[0] as unknown as { subject: string };
    expect(call.subject).toMatch(/€/);
  });

  it('inclut le prix et le créneau dans l’objet — visible sans ouvrir le message', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.resetModules();
    const { sendDetailerBookingEmail } = await import('@/lib/detailing/email');

    await sendDetailerBookingEmail(bookingPayload());

    const call = sendMock.mock.calls[0]?.[0] as unknown as { subject: string };
    expect(call.subject).toContain('50');
    expect(call.subject.length).toBeGreaterThan('Nouvelle réservation'.length);
  });

  it('ajoute un lien direct vers la réservation dans le dashboard', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.resetModules();
    const { sendDetailerBookingEmail } = await import('@/lib/detailing/email');

    await sendDetailerBookingEmail(bookingPayload());

    const call = sendMock.mock.calls[0]?.[0] as unknown as { text: string; html: string };
    expect(call.text).toContain('/app/bookings/booking-1');
    expect(call.html).toContain('/app/bookings/booking-1');
  });
});

describe('invitation calendrier (.ics)', () => {
  it('est jointe à l’e-mail du client', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.resetModules();
    const { sendClientBookingEmail } = await import('@/lib/detailing/email');

    await sendClientBookingEmail(bookingPayload());

    const call = sendMock.mock.calls[0]?.[0] as unknown as {
      attachments: readonly { filename: string; content: string }[];
    };
    expect(call.attachments).toHaveLength(1);
    expect(call.attachments[0]?.filename).toBe('reservation.ics');
    expect(call.attachments[0]?.content).toContain('BEGIN:VCALENDAR');
  });

  it('est jointe à l’e-mail du professionnel', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.resetModules();
    const { sendDetailerBookingEmail } = await import('@/lib/detailing/email');

    await sendDetailerBookingEmail(bookingPayload());

    const call = sendMock.mock.calls[0]?.[0] as unknown as {
      attachments: readonly { filename: string; content: string }[];
    };
    expect(call.attachments).toHaveLength(1);
    expect(call.attachments[0]?.filename).toBe('reservation.ics');
    expect(call.attachments[0]?.content).toContain('BEGIN:VCALENDAR');
  });
});

describe('bookingFromEmail() — code mort retiré', () => {
  it('n’existe plus dans lib/detailing/env.ts', async () => {
    const mod = await import('@/lib/detailing/env');
    expect((mod as Record<string, unknown>).bookingFromEmail).toBeUndefined();
  });
});
