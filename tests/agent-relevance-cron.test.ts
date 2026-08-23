import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Planificateur du classement par pertinence — même contrainte que
 * `hermes-outreach-cron.test.ts` : le fichier n'a aucune dépendance
 * (`fetch`, `process`, `Response` sont globaux), donc exécuté pour de vrai,
 * `fetch` doublé, plutôt que vérifié par simple lecture.
 */

const ROUTE = join(process.cwd(), 'netlify/functions/agent-relevance-cron.ts');
const REFERENCE = join(process.cwd(), 'netlify/functions/agent-process-cron.ts');

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('exécution', () => {
  it('refuse d’appeler la route si CRON_SECRET est absent, sans jamais logger sa valeur', async () => {
    vi.stubEnv('CRON_SECRET', '');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const errorSpy = vi.spyOn(console, 'error');

    vi.resetModules();
    const { default: agentRelevanceCron } = await import('../netlify/functions/agent-relevance-cron');

    const response = await agentRelevanceCron();

    expect(response.status).toBe(500);
    expect(fetchSpy).not.toHaveBeenCalled();
    for (const call of errorSpy.mock.calls) {
      expect(call.join(' ')).not.toMatch(/Bearer|secret-de-test/i);
    }
  });

  it('appelle POST /api/agent/relevance avec Authorization: Bearer $CRON_SECRET', async () => {
    vi.stubEnv('CRON_SECRET', 'secret-de-test');
    vi.stubEnv('URL', 'https://deploy-preview.example');
    const fetchSpy = vi.fn(
      async (_url: string, _init?: RequestInit) => new Response('{"processed":0}', { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchSpy);

    vi.resetModules();
    const { default: agentRelevanceCron } = await import('../netlify/functions/agent-relevance-cron');

    const response = await agentRelevanceCron();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const call = fetchSpy.mock.calls[0];
    if (!call) throw new Error('fetch n’a pas été appelé');
    const [url, init] = call;
    expect(url).toBe('https://deploy-preview.example/api/agent/relevance');
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer secret-de-test');
    expect(response.status).toBe(200);
  });

  it('retombe sur le domaine de production si Netlify ne fournit pas URL', async () => {
    vi.stubEnv('CRON_SECRET', 'secret-de-test');
    const fetchSpy = vi.fn(async (_url: string, _init?: RequestInit) => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);

    vi.resetModules();
    const { default: agentRelevanceCron } = await import('../netlify/functions/agent-relevance-cron');
    await agentRelevanceCron();

    const call = fetchSpy.mock.calls[0];
    if (!call) throw new Error('fetch n’a pas été appelé');
    expect(call[0]).toBe('https://qualifyragence.com/api/agent/relevance');
  });
});

describe('le créneau', () => {
  const route = readFileSync(ROUTE, 'utf-8');
  const scheduleMatch = route.match(/schedule:\s*'([^']+)'/);

  it('tourne toutes les quinze minutes, comme agent-process-cron', () => {
    expect(scheduleMatch?.[1]).toBe('*/15 * * * *');
  });
});

describe('structure Netlify', () => {
  const route = readFileSync(ROUTE, 'utf-8');
  const reference = readFileSync(REFERENCE, 'utf-8');

  it('exporte une fonction par défaut et une configuration de planification, comme les crons existants', () => {
    const shape = /export default async function \w+\(\) \{[\s\S]*export const config = \{\s*schedule: '[^']+',\s*\};/;
    expect(reference).toMatch(shape);
    expect(route).toMatch(shape);
  });

  it('appelle sa route par un chemin en dur, jamais reconstruit dynamiquement', () => {
    expect(route).toContain('${base}/api/agent/relevance`');
  });
});
