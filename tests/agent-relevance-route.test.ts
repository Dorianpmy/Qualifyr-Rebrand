import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `/api/agent/relevance` dépend de `server-only` via `supabase-server.ts` et
 * `relevance.ts` : pas d'exécution directe possible hors compilation Next.js
 * (même contrainte que les autres routes agent, voir
 * `hermes-outreach.test.ts`). Vérifié par lecture de code.
 */

const ROOT = process.cwd();
const route = readFileSync(join(ROOT, 'src/app/api/agent/relevance/route.ts'), 'utf-8');
const processRoute = readFileSync(join(ROOT, 'src/app/api/agent/process/route.ts'), 'utf-8');
const outreachRoute = readFileSync(join(ROOT, 'src/app/api/agent/outreach/route.ts'), 'utf-8');
const outreach = readFileSync(join(ROOT, 'src/lib/agent/outreach.ts'), 'utf-8');
const migration = readFileSync(
  join(ROOT, 'supabase/migrations/020_agent_prospects_relevance.sql'),
  'utf-8',
);

describe('protégée par le secret du planificateur', () => {
  it('refuse sans le bon secret', () => {
    expect(route).toContain('process.env.CRON_SECRET');
    expect(route).toMatch(/status: 401/);
  });
});

describe('Mistral, appelé nulle part ailleurs qu’ici', () => {
  it('agent/process ne dépend jamais de Mistral', () => {
    // Cette route a 60 s et un quota Sirene à tenir : un appel Mistral lent
    // y menacerait exactement ce que le bail (migration 018) protège.
    expect(processRoute).not.toMatch(/mistral/i);
  });

  it('outreach n’en dépend jamais non plus', () => {
    // La route d'envoi ne doit jamais dépendre d'un fournisseur externe pour
    // décider d'envoyer.
    expect(outreachRoute).not.toMatch(/mistral/i);
  });
});

describe('modèle indisponible = ordre actuel', () => {
  it('l’absence de MISTRAL_API_KEY ne bloque rien, juste ne classe pas', () => {
    const configCheck = route.indexOf('MISTRAL_API_KEY');
    expect(configCheck).toBeGreaterThanOrEqual(0);
    // Pas de statut d'erreur associé à cette absence : une réponse normale,
    // à la différence d'une configuration réellement bloquante (comparer à
    // `HERMES_FROM_EMAIL`, qui répond 503 dans outreach/route.ts).
    const nearby = route.slice(configCheck, configCheck + 300);
    expect(nearby).not.toMatch(/status: 5\d\d/);
  });

  it('un échec de fetchRelevanceScores arrête le lot sans faire échouer la route', () => {
    const failureCheck = route.indexOf('if (!result.ok)');
    expect(failureCheck).toBeGreaterThanOrEqual(0);
    const nearby = route.slice(failureCheck, failureCheck + 300);
    expect(nearby).not.toMatch(/status: 5\d\d/);
  });
});

describe('une campagne par passage, résolue comme dans outreach.ts', () => {
  it('utilise la même résolution e-mail propriétaire → zones que nextCandidates', () => {
    expect(route).toContain('auth.admin.getUserById');
    expect(route).toContain("ilike('email', ownerEmail)");
  });

  it('ne note que les prospects jamais notés', () => {
    expect(route).toContain("is('scored_at', null)");
  });
});

describe('nextCandidates trie par pertinence, nulls en dernier', () => {
  it('précise nullsFirst: false — Postgres met les NULL en tête par défaut sur un tri DESC', () => {
    // Sans cette précision explicite, tous les prospects jamais notés
    // passeraient devant les notés : l'inverse de ce qui est demandé.
    expect(outreach).toMatch(
      /order\(\s*'relevance_score',\s*\{\s*ascending:\s*false,\s*nullsFirst:\s*false\s*\}\s*\)/,
    );
  });

  it('le tri par pertinence précède le tri par ancienneté', () => {
    const relevanceOrder = outreach.indexOf("order('relevance_score'");
    const createdOrder = outreach.indexOf("order('created_at'");
    expect(relevanceOrder).toBeGreaterThanOrEqual(0);
    expect(relevanceOrder).toBeLessThan(createdOrder);
  });
});

describe('migration 020', () => {
  it('le score reste nullable indéfiniment — il ordonne, il n’exclut jamais', () => {
    expect(migration).toContain('add column if not exists relevance_score integer');
    expect(migration).not.toMatch(/relevance_score integer not null/);
  });

  it('borne le score à [0, 100] sans interdire null', () => {
    expect(migration).toMatch(
      /check \(relevance_score is null or relevance_score between 0 and 100\)/,
    );
  });

  it('activity_description vit sur hermes_campaigns, pas sur agent_zones', () => {
    expect(migration).toMatch(/alter table public\.hermes_campaigns[\s\S]*activity_description/);
  });

  it('est idempotente', () => {
    expect(migration).toContain('add column if not exists');
    expect(migration).toContain('drop constraint if exists');
  });
});
