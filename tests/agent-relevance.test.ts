import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

/*
 * `server-only` lève une erreur dès qu'il est importé hors d'une compilation
 * Next.js — ce que fait `relevance.ts`. Neutralisé ici pour ce seul fichier
 * de test, comme dans `hermes-webhook.test.ts`.
 */
vi.mock('server-only', () => ({}));

import {
  RELEVANCE_BATCH_SIZE,
  buildRelevancePrompt,
  parseRelevanceResponse,
  type ScorableProspect,
} from '../src/lib/agent/relevance';

/**
 * Classement des prospects par pertinence (Hermès).
 *
 * `buildRelevancePrompt` et `parseRelevanceResponse` sont pures — ni réseau
 * ni base — donc exécutées pour de vrai. `fetchRelevanceScores`, le seul
 * point qui touche le réseau, est vérifiée par lecture de code, sur le même
 * principe que `attemptReportSend` (`agent/process`) ou `fetchSegment`
 * (`sirene.ts`).
 */

const PROSPECTS: readonly ScorableProspect[] = [
  { id: 'p1', name: 'Garage Durand', nafCode: '45.20A', city: 'Avignon', workforceRange: '1-2' },
  { id: 'p2', name: 'Location Rapide', nafCode: '77.11Z', city: 'Avignon', workforceRange: '10-19' },
  { id: 'p3', name: 'Dupont Jean', nafCode: '49.32Z', city: 'Avignon', workforceRange: '0' },
];

describe('buildRelevancePrompt', () => {
  it('numérote les entrées par position, jamais par identifiant', () => {
    const { user } = buildRelevancePrompt({ activityDescription: 'Lavage de flottes', prospects: PROSPECTS });
    const items = JSON.parse(user.split('Établissements à classer :\n')[1] ?? '[]') as readonly Record<
      string,
      unknown
    >[];

    expect(items).toHaveLength(3);
    expect(items.map((item) => item.index)).toEqual([0, 1, 2]);
  });

  it('ne transmet jamais d’adresse e-mail', () => {
    // Le type ScorableProspect n'en porte pas ; ce test vérifie le résultat
    // réellement sérialisé, pas seulement la définition du type.
    const { system, user } = buildRelevancePrompt({
      activityDescription: 'Lavage de flottes',
      prospects: PROSPECTS,
    });
    expect(system + user).not.toMatch(/@/);
  });

  it('ne transmet jamais l’identifiant interne agent_prospects.id', () => {
    const { user } = buildRelevancePrompt({ activityDescription: 'Lavage de flottes', prospects: PROSPECTS });
    for (const prospect of PROSPECTS) {
      expect(user).not.toContain(`"${prospect.id}"`);
    }
  });

  it('transmet exactement raison sociale, code NAF, ville, tranche d’effectif — rien de plus', () => {
    const { user } = buildRelevancePrompt({
      activityDescription: 'Lavage de flottes',
      prospects: [PROSPECTS[0] as ScorableProspect],
    });
    const items = JSON.parse(user.split('Établissements à classer :\n')[1] ?? '[]') as readonly Record<
      string,
      unknown
    >[];
    expect(Object.keys(items[0] ?? {}).sort()).toEqual(['city', 'index', 'naf', 'name', 'workforce']);
  });

  it('demande explicitement de reprendre l’index, pas un autre identifiant', () => {
    const { system } = buildRelevancePrompt({ activityDescription: 'x', prospects: PROSPECTS });
    expect(system).toMatch(/index/);
  });
});

describe('parseRelevanceResponse — les trois garde-fous', () => {
  it('un score hors [0,100] devient null, pas rejeté ni tronqué', () => {
    const result = parseRelevanceResponse(
      JSON.stringify({ scores: [{ index: 0, score: 150 }, { index: 1, score: -5 }] }),
      2,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('inattendu');
    expect(result.scoresByIndex.get(0)).toBeNull();
    expect(result.scoresByIndex.get(1)).toBeNull();
  });

  it('un index inconnu du lot est ignoré, pas planté', () => {
    const result = parseRelevanceResponse(JSON.stringify({ scores: [{ index: 99, score: 80 }] }), 3);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('inattendu');
    expect(result.scoresByIndex.get(99)).toBeUndefined();
    expect([...result.scoresByIndex.values()]).toEqual([null, null, null]);
  });

  it('une réponse tronquée laisse les entrées manquantes à null, sans rien perdre', () => {
    // Sur 5 prospects envoyés, le modèle n'en note que 2 : les 3 autres
    // doivent rester des candidats valides, pas disparaître.
    const result = parseRelevanceResponse(
      JSON.stringify({ scores: [{ index: 0, score: 90 }, { index: 3, score: 10 }] }),
      5,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('inattendu');
    expect(result.scoresByIndex.size).toBe(5);
    expect(result.scoresByIndex.get(0)).toBe(90);
    expect(result.scoresByIndex.get(3)).toBe(10);
    expect(result.scoresByIndex.get(1)).toBeNull();
    expect(result.scoresByIndex.get(2)).toBeNull();
    expect(result.scoresByIndex.get(4)).toBeNull();
  });

  it('un score non entier est traité comme hors borne', () => {
    const result = parseRelevanceResponse(JSON.stringify({ scores: [{ index: 0, score: 55.5 }] }), 1);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('inattendu');
    expect(result.scoresByIndex.get(0)).toBeNull();
  });

  it('un JSON illisible : échec total, rien n’est écrit', () => {
    const result = parseRelevanceResponse('{ceci n’est pas du JSON', 5);
    expect(result).toEqual({ ok: false });
  });

  it('un objet sans le tableau scores : échec total', () => {
    const result = parseRelevanceResponse(JSON.stringify({ autre_chose: [] }), 5);
    expect(result).toEqual({ ok: false });
  });

  it('une entrée du tableau structurellement invalide est ignorée, pas fatale pour les autres', () => {
    const result = parseRelevanceResponse(
      JSON.stringify({ scores: [{ index: 0, score: 'haut' }, { index: 1, score: 70 }] }),
      2,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('inattendu');
    expect(result.scoresByIndex.get(0)).toBeNull();
    expect(result.scoresByIndex.get(1)).toBe(70);
  });

  it('un lot vide ne fait planter personne', () => {
    const result = parseRelevanceResponse(JSON.stringify({ scores: [] }), 0);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('inattendu');
    expect(result.scoresByIndex.size).toBe(0);
  });
});

describe('ScorableProspect — verrouillage structurel', () => {
  const source = readFileSync(join(process.cwd(), 'src/lib/agent/relevance.ts'), 'utf-8');
  const typeBlock = source.slice(
    source.indexOf('export type ScorableProspect'),
    source.indexOf('};', source.indexOf('export type ScorableProspect')),
  );

  it('ne porte ni email ni jeton de désinscription', () => {
    expect(typeBlock).not.toMatch(/email/i);
    expect(typeBlock).not.toMatch(/unsubscribe/i);
  });
});

describe('garde-fous du code — appel réseau isolé', () => {
  const source = readFileSync(join(process.cwd(), 'src/lib/agent/relevance.ts'), 'utf-8');

  it('vérifie MISTRAL_API_KEY avant tout appel réseau', () => {
    const configCheck = source.indexOf("process.env.MISTRAL_API_KEY");
    const fetchCall = source.indexOf("fetch('https://api.mistral.ai");
    expect(configCheck).toBeGreaterThanOrEqual(0);
    expect(configCheck).toBeLessThan(fetchCall);
  });

  it('épingle une version datée du modèle, pas -latest', () => {
    // Recherché dans la valeur de la constante elle-même, pas dans tout le
    // fichier : le commentaire qui explique pourquoi `-latest` est évité
    // contient légitimement cette chaîne.
    const match = source.match(/const MISTRAL_MODEL = '([^']+)';/);
    expect(match?.[1]).toBe('mistral-small-2603');
    expect(match?.[1]).not.toContain('latest');
  });

  it('demande le mode JSON schema strict, pas du texte libre', () => {
    expect(source).toContain("type: 'json_schema'");
    expect(source).toContain('strict: true');
  });

  it('borne le temps d’attente réseau', () => {
    expect(source).toContain('AbortSignal.timeout');
  });

  it('le lot ne dépasse jamais la taille documentée', () => {
    expect(RELEVANCE_BATCH_SIZE).toBe(50);
  });
});
