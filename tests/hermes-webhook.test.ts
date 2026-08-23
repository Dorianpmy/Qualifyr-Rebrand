import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * `server-only` lève une erreur dès qu'il est importé hors d'une compilation
 * Next.js (RSC) — ce que fait, transitivement, `route.ts` via
 * `lib/agent/outreach.ts`. Neutralisé ici pour ce seul fichier de test : la
 * route continue de le déclarer en production, seul vitest reçoit un module
 * vide.
 */
vi.mock('server-only', () => ({}));

/**
 * Webhook Hermès — rebonds et plaintes Resend.
 *
 * Contrairement aux tests de `hermes-outreach.test.ts` (lecture de code, faute
 * de base PostgreSQL de test), la vérification de signature est pure et ne
 * dépend d'aucun réseau : elle est donc testée pour de vrai, avec une
 * réimplémentation indépendante du schéma Svix dans ce fichier — si l'une des
 * deux dérive de l'autre (mauvais ordre `id.timestamp.payload`, mauvais sens
 * de décodage base64…), les signatures calculées ne concordent plus et les
 * tests échouent.
 *
 * Sans `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` dans cet
 * environnement, `getServiceSupabaseClient()` renvoie `null` : les scénarios
 * qui passent la signature et le filtrage par type s'arrêtent donc à « base
 * indisponible » (503), ce qui suffit à prouver que la signature a bien été
 * acceptée sans avoir à doubler Supabase.
 */

const SECRET = 'whsec_aGVybWVzLXdlYmhvb2stc2VjcmV0LWZvci10ZXN0cw==';

function base64Decode(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64Encode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function sign(svixId: string, svixTimestamp: string, payload: string): Promise<string> {
  const secretBytes = base64Decode(SECRET.replace(/^whsec_/, ''));
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${svixId}.${svixTimestamp}.${payload}`),
  );
  return `v1,${base64Encode(new Uint8Array(digest))}`;
}

function request(payload: string, headers: Record<string, string>): Request {
  return new Request('https://qualifyragence.com/api/agent/outreach/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: payload,
  });
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubEnv('RESEND_WEBHOOK_SECRET', SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  // `vi.doMock` (contrairement à `vi.mock`) reste actif au-delà du test qui
  // l'a posé tant qu'il n'est pas explicitement retiré : sans ce nettoyage,
  // un test qui mocke Supabase ou `suppress` contaminerait les suivants.
  vi.doUnmock('@/lib/agent/outreach');
  vi.doUnmock('@/lib/detailing/supabase-server');
});

describe('POST /api/agent/outreach/webhook', () => {
  it('refuse quand le secret n’est pas configuré', async () => {
    vi.unstubAllEnvs();
    vi.resetModules();
    const { POST } = await import('@/app/api/agent/outreach/webhook/route');

    const response = await POST(request('{}', {}));
    expect(response.status).toBe(503);
  });

  it('refuse une signature qui ne correspond pas au corps envoyé', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/agent/outreach/webhook/route');

    const svixId = 'msg_1';
    const svixTimestamp = String(Math.floor(Date.now() / 1000));
    const payload = JSON.stringify({ type: 'email.bounced', data: { to: ['x@test.fr'] } });
    // Signée pour un autre corps que celui réellement envoyé.
    const signature = await sign(svixId, svixTimestamp, '{"type":"autre chose"}');

    const response = await POST(
      request(payload, { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': signature }),
    );
    expect(response.status).toBe(400);
  });

  it('refuse un événement trop ancien, même signé correctement', async () => {
    // Protection contre le rejeu : un événement de plus de cinq minutes n'est
    // plus accepté, quand bien même sa signature est mathématiquement juste.
    vi.resetModules();
    const { POST } = await import('@/app/api/agent/outreach/webhook/route');

    const svixId = 'msg_2';
    const svixTimestamp = String(Math.floor(Date.now() / 1000) - 3600);
    const payload = JSON.stringify({ type: 'email.bounced', data: { to: ['x@test.fr'] } });
    const signature = await sign(svixId, svixTimestamp, payload);

    const response = await POST(
      request(payload, { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': signature }),
    );
    expect(response.status).toBe(400);
  });

  it('accepte un événement signé qu’elle ne traite pas, sans toucher à la base', async () => {
    // `email.opened` ne fait partie ni des rebonds ni des plaintes : la route
    // doit répondre 200 sans jamais atteindre le code qui suppose une base
    // disponible.
    vi.resetModules();
    const { POST } = await import('@/app/api/agent/outreach/webhook/route');

    const svixId = 'msg_3';
    const svixTimestamp = String(Math.floor(Date.now() / 1000));
    const payload = JSON.stringify({ type: 'email.opened', data: { to: ['x@test.fr'] } });
    const signature = await sign(svixId, svixTimestamp, payload);

    const response = await POST(
      request(payload, { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': signature }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
  });

  it('accepte un rebond correctement signé et l’envoie vers le traitement (base indisponible ici)', async () => {
    // Sans Supabase configuré dans cet environnement de test, le traitement
    // réel du rebond échoue en 503 — ce qui prouve que la signature et le
    // type ont bien été acceptés, seule l'écriture en base manque.
    vi.resetModules();
    const { POST } = await import('@/app/api/agent/outreach/webhook/route');

    const svixId = 'msg_4';
    const svixTimestamp = String(Math.floor(Date.now() / 1000));
    const payload = JSON.stringify({
      type: 'email.complained',
      data: { email_id: 'em_1', to: ['prospect@test.fr'] },
    });
    const signature = await sign(svixId, svixTimestamp, payload);

    const response = await POST(
      request(payload, { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': signature }),
    );
    expect(response.status).toBe(503);
  });

  it('accepte une signature valide parmi plusieurs (rotation de secret)', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/agent/outreach/webhook/route');

    const svixId = 'msg_5';
    const svixTimestamp = String(Math.floor(Date.now() / 1000));
    const payload = JSON.stringify({ type: 'email.opened', data: { to: ['x@test.fr'] } });
    const valid = await sign(svixId, svixTimestamp, payload);

    const response = await POST(
      request(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': `v1,signature-invalide ${valid}`,
      }),
    );
    expect(response.status).toBe(200);
  });

  it('rebond permanent (adresse ou domaine mort) : supprime l’adresse', async () => {
    // `getServiceSupabaseClient` et `suppress` sont doublés ici, et seulement
    // ici : c'est le seul moyen d'observer la distinction dur/mou sans base
    // réelle. Pas d'`email_id` dans le payload : la route ne cherche alors
    // aucun message d'origine, donc aucune autre requête Supabase n'est
    // nécessaire pour ce scénario.
    const suppressSpy = vi.fn(async () => {});
    vi.doMock('@/lib/agent/outreach', () => ({ suppress: suppressSpy }));
    vi.doMock('@/lib/detailing/supabase-server', () => ({
      getServiceSupabaseClient: () => ({}),
    }));
    vi.resetModules();
    const { POST } = await import('@/app/api/agent/outreach/webhook/route');

    const svixId = 'msg_hard';
    const svixTimestamp = String(Math.floor(Date.now() / 1000));
    const payload = JSON.stringify({
      type: 'email.bounced',
      data: { to: ['mort@test.fr'], bounce: { type: 'Permanent', subType: 'General' } },
    });
    const signature = await sign(svixId, svixTimestamp, payload);

    const response = await POST(
      request(payload, { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': signature }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ suppressed: true });
    expect(suppressSpy).toHaveBeenCalledWith('mort@test.fr', 'bounced', null);
  });

  it('rebond mou, ou de type absent/inconnu (boîte pleine, serveur momentanément indisponible…) : conserve l’adresse', async () => {
    // Le cas critique n'est pas « Transient » explicite, c'est l'absence de
    // champ `bounce` : c'est ce qui doit rester sûr par défaut. Un payload
    // Resend qui change de forme ne doit jamais faire basculer une adresse
    // vivante en suppression définitive.
    const suppressSpy = vi.fn(async () => {});
    vi.doMock('@/lib/agent/outreach', () => ({ suppress: suppressSpy }));
    vi.doMock('@/lib/detailing/supabase-server', () => ({
      getServiceSupabaseClient: () => ({}),
    }));
    vi.resetModules();
    const { POST } = await import('@/app/api/agent/outreach/webhook/route');

    const svixId = 'msg_soft';
    const svixTimestamp = String(Math.floor(Date.now() / 1000));
    const payload = JSON.stringify({ type: 'email.bounced', data: { to: ['boite-pleine@test.fr'] } });
    const signature = await sign(svixId, svixTimestamp, payload);

    const response = await POST(
      request(payload, { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': signature }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ suppressed: false });
    expect(suppressSpy).not.toHaveBeenCalled();
  });
});

describe('garde-fous du code', () => {
  const ROOT = process.cwd();
  const route = readFileSync(
    join(ROOT, 'src/app/api/agent/outreach/webhook/route.ts'),
    'utf-8',
  );

  it('ne fait jamais dépendre la suppression de la traçabilité du message d’origine', () => {
    // `sourceOwnerId` est déclaré en dehors du bloc qui retrouve le message
    // d'origine, et `suppress` est appelé après ce bloc : un message
    // introuvable laisse `sourceOwnerId` à `null` mais n'empêche pas l'appel.
    const declaration = route.indexOf('let sourceOwnerId');
    const lookup = route.indexOf('if (event.data.email_id)');
    const suppressCall = route.indexOf('await suppress(recipient');

    expect(declaration).toBeGreaterThanOrEqual(0);
    expect(declaration).toBeLessThan(lookup);
    expect(suppressCall).toBeGreaterThan(lookup);
  });

  it('ne traite que les rebonds et les plaintes', () => {
    expect(route).toContain("new Set(['email.bounced', 'email.complained'])");
  });

  it('ne classe en rebond définitif que le type Permanent', () => {
    // Toute autre valeur — y compris absente — doit rester du côté « mou ».
    expect(route).toContain("const HARD_BOUNCE_TYPE = 'Permanent';");
    expect(route).toContain('event.data.bounce?.type === HARD_BOUNCE_TYPE');
  });
});
