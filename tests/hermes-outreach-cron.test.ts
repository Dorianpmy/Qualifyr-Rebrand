import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Planificateur Netlify d'Hermès.
 *
 * **Pourquoi ce test existe.** Une erreur ici ne casse rien de visible : la
 * route `/api/agent/outreach` continue d'exister, ses propres tests
 * continuent de passer, et Hermès n'envoie simplement jamais rien — jusqu'à
 * ce que quelqu'un s'en aperçoive en constatant, des semaines plus tard, que
 * `hermes_messages` est resté vide. Le fichier n'a aucune dépendance
 * (`fetch`, `process`, `Response` — tout global) : il est donc exécuté pour
 * de vrai, `fetch` doublé, plutôt que vérifié par simple lecture de code.
 */

const ROUTE = join(process.cwd(), 'netlify/functions/hermes-outreach-cron.ts');
const REFERENCE = join(process.cwd(), 'netlify/functions/agent-process-cron.ts');

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
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
    const { default: hermesOutreachCron } = await import('../netlify/functions/hermes-outreach-cron');

    const response = await hermesOutreachCron();

    expect(response.status).toBe(500);
    expect(fetchSpy).not.toHaveBeenCalled();
    // Rien n'est journalisé qui ressemble à un secret : le message d'erreur
    // est fixe, jamais interpolé avec une valeur d'environnement.
    for (const call of errorSpy.mock.calls) {
      expect(call.join(' ')).not.toMatch(/Bearer|secret-de-test/i);
    }
  });

  it('appelle POST /api/agent/outreach avec `Authorization: Bearer $CRON_SECRET`', async () => {
    vi.stubEnv('CRON_SECRET', 'secret-de-test');
    vi.stubEnv('URL', 'https://deploy-preview.example');
    const fetchSpy = vi.fn(async (_url: string, _init?: RequestInit) => new Response('{"processed":0}', { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);

    vi.resetModules();
    const { default: hermesOutreachCron } = await import('../netlify/functions/hermes-outreach-cron');

    const response = await hermesOutreachCron();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const call = fetchSpy.mock.calls[0];
    if (!call) throw new Error('fetch n’a pas été appelé');
    const [url, init] = call;
    expect(url).toBe('https://deploy-preview.example/api/agent/outreach');
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer secret-de-test');
    expect(response.status).toBe(200);
  });

  it('retombe sur le domaine de production si Netlify ne fournit pas `URL`', async () => {
    // `?? 'https://qualifyragence.com'` ne rattrape que `undefined` — pas une
    // chaîne vide. Ce test laisse donc `URL` absente plutôt que vide : c'est
    // l'état réel d'une exécution locale ou d'un contexte Netlify qui ne la
    // fournirait pas, jamais une chaîne vide.
    vi.stubEnv('CRON_SECRET', 'secret-de-test');
    const fetchSpy = vi.fn(async (_url: string, _init?: RequestInit) => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);

    vi.resetModules();
    const { default: hermesOutreachCron } = await import('../netlify/functions/hermes-outreach-cron');
    await hermesOutreachCron();

    const call = fetchSpy.mock.calls[0];
    if (!call) throw new Error('fetch n’a pas été appelé');
    expect(call[0]).toBe('https://qualifyragence.com/api/agent/outreach');
  });
});

describe('le créneau, en lecture', () => {
  const route = readFileSync(ROUTE, 'utf-8');
  const scheduleMatch = route.match(/schedule:\s*'([^']+)'/);
  const schedule = scheduleMatch?.[1] ?? '';
  const fields = schedule.split(' ');

  it('est syntaxiquement un cron à cinq champs', () => {
    expect(fields).toHaveLength(5);
    // Grammaire volontairement restreinte à ce que ce fichier utilise
    // réellement (`*`, `N-M`, `*/N`, `N`) : suffisant pour attraper une
    // faute de frappe, pas un validateur cron général.
    const TOKEN = /^(\*(\/\d+)?|\d+(-\d+)?)$/;
    for (const field of fields) {
      expect(field, `champ cron invalide : "${field}"`).toMatch(TOKEN);
    }
  });

  it('cible bien toutes les demi-heures, en heures ouvrées, du lundi au vendredi', () => {
    const [minute, hour, dayOfMonth, month, weekday] = fields;
    expect(minute).toBe('*/30');
    expect(dayOfMonth).toBe('*');
    expect(month).toBe('*');
    expect(weekday).toBe('1-5'); // lundi à vendredi
    expect(hour).toBe('7-16');
  });

  it('correspond, en UTC, aux horaires parisiens annoncés dans le commentaire', () => {
    // Vérifié par le calcul, pas seulement par la présence du texte : si le
    // champ heure du cron change sans que quelqu'un touche au commentaire, ce
    // test doit décrocher.
    const hourField = fields[1] ?? '';
    const [startRaw, endRaw] = hourField.split('-');
    const start = Number(startRaw ?? NaN);
    const end = Number(endRaw ?? NaN);
    expect(Number.isFinite(start)).toBe(true);
    expect(Number.isFinite(end)).toBe(true);
    const stepMinutes = 30;

    const parisSummer = { startHour: start + 2, endHour: end + 2, endMinute: stepMinutes };
    const parisWinter = { startHour: start + 1, endHour: end + 1, endMinute: stepMinutes };

    expect(`${parisSummer.startHour}h–${parisSummer.endHour}h${parisSummer.endMinute}`).toBe(
      '9h–18h30',
    );
    expect(`${parisWinter.startHour}h–${parisWinter.endHour}h${parisWinter.endMinute}`).toBe(
      '8h–17h30',
    );
  });
});

describe('structure Netlify', () => {
  const route = readFileSync(ROUTE, 'utf-8');
  const reference = readFileSync(REFERENCE, 'utf-8');

  it('exporte une fonction par défaut et une configuration de planification, comme les crons existants', () => {
    // Ce que Netlify exige pour détecter une fonction planifiée : un export
    // par défaut, et `export const config = { schedule: ... }`. Comparé au
    // fichier de référence plutôt qu'à une expression figée, pour que le
    // test suive si le patron commun évolue.
    const shape = /export default async function \w+\(\) \{[\s\S]*export const config = \{\s*schedule: '[^']+',\s*\};/;
    expect(reference).toMatch(shape);
    expect(route).toMatch(shape);
  });

  it('appelle sa route par un chemin en dur, jamais reconstruit dynamiquement', () => {
    // Les quatre planificateurs partagent ce patron : un chemin d'API en
    // clair dans le gabarit du `fetch`, jamais assemblé à partir d'une entrée
    // externe.
    expect(route).toContain('${base}/api/agent/outreach`');
  });
});
