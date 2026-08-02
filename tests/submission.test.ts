import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests des routes de soumission.
 *
 * `fetch` est remplacé : aucun appel réseau réel, aucune clé requise.
 * Les variables d'environnement sont posées puis retirées à chaque test.
 */

const validDiagnostic = {
  activity: 'nettoyage-detailing',
  activityDetails: '',
  practiceMode: 'domicile',
  conciergeType: '',
  company: 'Éclat Mobile',
  website: '',
  siteSituation: 'peu-demandes',
  demandSources: ['whatsapp'],
  situationNote: 'Trop d’allers-retours avant de fixer un rendez-vous.',
  priorities: ['clarifier-offre', 'prise-contact'],
  desiredResult: 'Recevoir des demandes plus précises.',
  timing: 'un-trois-mois',
  budgetStatus: 'pas-encore',
  budgetAmount: '',
  constraints: '',
  firstName: 'Camille',
  lastName: 'Rousseau',
  email: 'camille@eclat-mobile.fr',
  phone: '',
  preferredContact: 'whatsapp',
  consent: true,
  fax: '',
  elapsedMs: 9000,
  pageUrl: 'https://qualifyragence.com/diagnostic',
};

function request(body: unknown, ip = '203.0.113.1') {
  return new Request('https://qualifyragence.com/api/diagnostic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

/** Recharge les modules pour repartir d'une table de débit vide. */
async function loadRoute() {
  vi.resetModules();
  return import('@/app/api/diagnostic/route');
}

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

describe('POST /api/diagnostic — succès', () => {
  it('répond 200 et envoie la notification puis l’accusé de réception', async () => {
    configureEmail();
    const send = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', send);

    const { POST } = await loadRoute();
    const response = await POST(request(validDiagnostic));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    // notification à Qualifyr + accusé de réception au visiteur
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('inclut les informations attendues dans l’e-mail reçu par Qualifyr', async () => {
    configureEmail();
    const send = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', send);

    const { POST } = await loadRoute();
    await POST(request(validDiagnostic));

    const firstCall = send.mock.calls[0] as unknown as [string, RequestInit] | undefined;
    const payload = JSON.parse(String(firstCall?.[1]?.body ?? '{}')) as {
      text?: string;
      reply_to?: string;
    };
    const text = String(payload.text);

    expect(payload.reply_to).toBe(validDiagnostic.email);
    for (const expected of [
      'Diagnostic',
      'Reçue le',
      `${validDiagnostic.firstName} ${validDiagnostic.lastName}`,
      validDiagnostic.email,
      validDiagnostic.company,
      'Priorités',
      'Demandes reçues par',
      'Origine de la demande',
      'Page de soumission',
      'Source directe ou non identifiée',
      validDiagnostic.situationNote,
      validDiagnostic.pageUrl,
    ]) {
      expect(text).toContain(expected);
    }
  });
});

describe('POST /api/diagnostic — validation serveur', () => {
  it('répond 422 avec les erreurs par champ', async () => {
    configureEmail();
    vi.stubGlobal('fetch', vi.fn());

    const { POST } = await loadRoute();
    const response = await POST(
      request({ ...validDiagnostic, email: 'nope', company: '' }),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.ok).toBe(false);
    expect(body.errors.email).toBeDefined();
    expect(body.errors.company).toBeDefined();
  });

  it('répond 400 sur un corps illisible', async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request('https://qualifyragence.com/api/diagnostic', {
        method: 'POST',
        body: 'pas du json',
      }),
    );
    expect(response.status).toBe(400);
  });
});

describe('POST /api/diagnostic — anti-spam', () => {
  it('ignore silencieusement une soumission dont le champ piège est rempli', async () => {
    configureEmail();
    const send = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', send);

    const { POST } = await loadRoute();
    const response = await POST(request({ ...validDiagnostic, fax: 'https://spam.example' }));
    const body = await response.json();

    // Réponse volontairement identique à un succès : ne rien apprendre au robot.
    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    // Mais aucun e-mail n'est parti.
    expect(send).not.toHaveBeenCalled();
  });

  it('refuse une soumission trop rapide', async () => {
    configureEmail();
    const send = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', send);

    const { POST } = await loadRoute();
    const response = await POST(request({ ...validDiagnostic, elapsedMs: 200 }));

    expect(response.status).toBe(422);
    expect(send).not.toHaveBeenCalled();
  });

  it('bloque après plusieurs envois depuis la même adresse', async () => {
    configureEmail();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));

    const { POST } = await loadRoute();
    const statuses: number[] = [];
    for (let index = 0; index < 7; index += 1) {
      const response = await POST(request(validDiagnostic, '198.51.100.7'));
      statuses.push(response.status);
    }

    expect(statuses).toContain(429);
  });
});

describe('POST /api/diagnostic — panne du fournisseur', () => {
  it('répond 502 et ne prétend pas que le message est parti', async () => {
    configureEmail();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"message":"forbidden"}', { status: 403 })),
    );

    const { POST } = await loadRoute();
    const response = await POST(request(validDiagnostic));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/pas pu être transmis/i);
  });

  it('répond 502 si le fournisseur est injoignable', async () => {
    configureEmail();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );

    const { POST } = await loadRoute();
    const response = await POST(request(validDiagnostic));

    expect(response.status).toBe(502);
  });
});

describe('POST /api/diagnostic — configuration absente', () => {
  it('en production, répond 503 sans prétendre avoir envoyé', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('CONTACT_TO_EMAIL', '');
    vi.stubEnv('CONTACT_FROM_EMAIL', '');
    const send = vi.fn();
    vi.stubGlobal('fetch', send);

    const { POST } = await loadRoute();
    const response = await POST(request(validDiagnostic));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/n’a pas été transmis/);
    // Aucun détail technique en production.
    expect(body.missing).toBeUndefined();
    expect(send).not.toHaveBeenCalled();
  });

  it('hors production, indique les variables manquantes', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('CONTACT_TO_EMAIL', '');
    vi.stubEnv('CONTACT_FROM_EMAIL', '');
    vi.stubGlobal('fetch', vi.fn());

    const { POST } = await loadRoute();
    const response = await POST(request(validDiagnostic));

    // Le transport console prend le relais : le parcours reste déroulable.
    expect(response.status).toBe(200);
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
