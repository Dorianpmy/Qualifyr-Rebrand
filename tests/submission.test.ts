import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests des routes de soumission.
 *
 * `fetch` est remplacé : aucun appel réseau réel, aucune clé requise.
 * Les variables d'environnement sont posées puis retirées à chaque test.
 */

function configureEmail() {
  vi.stubEnv('RESEND_API_KEY', 'test-key');
  vi.stubEnv('CONTACT_TO_EMAIL', 'bonjour@qualifyragence.com');
  vi.stubEnv('CONTACT_FROM_EMAIL', 'Qualifyr <no-reply@qualifyragence.com>');
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('POST /api/diagnostic — route retirée', () => {
  it('répond 404 : le parcours de diagnostic a été retiré du site', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/diagnostic/route');
    const response = await POST();

    expect(response.status).toBe(404);
  });
});

describe('POST /api/contact', () => {
  it('accepte un message valide', async () => {
    configureEmail();
    const send = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', send);

    vi.resetModules();
    const { POST } = await import('@/app/api/contact/route');

    const response = await POST(
      new Request('https://qualifyragence.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.0.2.55' },
        body: JSON.stringify({
          fullName: 'Camille Rousseau',
          email: 'camille@eclat-mobile.fr',
          company: '',
          message: 'Bonjour, j’aimerais comprendre comment vous travaillez.',
          consent: true,
          fax: '',
          elapsedMs: 9000,
          pageUrl: 'https://qualifyragence.com/contact',
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('refuse un message sans consentement', async () => {
    configureEmail();
    vi.stubGlobal('fetch', vi.fn());

    vi.resetModules();
    const { POST } = await import('@/app/api/contact/route');

    const response = await POST(
      new Request('https://qualifyragence.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.0.2.56' },
        body: JSON.stringify({
          fullName: 'Camille Rousseau',
          email: 'camille@eclat-mobile.fr',
          company: '',
          message: 'Bonjour, j’aimerais comprendre comment vous travaillez.',
          consent: false,
          fax: '',
          elapsedMs: 9000,
          pageUrl: '',
        }),
      }),
    );

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.errors.consent).toBeDefined();
  });
});
