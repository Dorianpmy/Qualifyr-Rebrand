import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `/api/agent/process` dépend de `server-only` via `sirene.ts` et
 * `supabase-server.ts` : pas d'exécution directe possible hors compilation
 * Next.js (voir `hermes-outreach.test.ts` pour la même contrainte). La
 * décision pure (`nextReportState`, `buildReportErrorMessage`) est testée
 * pour de vrai dans `agent-report-retry.test.ts` ; ce fichier vérifie par
 * lecture que la route les branche correctement et ne réintroduit pas le
 * défaut corrigé.
 */

const ROOT = process.cwd();
const route = readFileSync(join(ROOT, 'src/app/api/agent/process/route.ts'), 'utf-8');
const migration = readFileSync(
  join(ROOT, 'supabase/migrations/017_agent_zones_report_retry.sql'),
  'utf-8',
);
const prospectionPage = readFileSync(
  join(ROOT, 'src/app/app/prospection/page.tsx'),
  'utf-8',
);

describe('deux files distinctes, jamais une seule triée par ancienneté', () => {
  it('interroge rapport_en_attente et en_attente séparément, pas via un .in() commun', () => {
    /*
     * Le défaut corrigé : `.in('status', ['en_attente', 'rapport_en_attente'])`
     * triée par ancienneté aurait fait passer les renvois toujours avant les
     * nouvelles zones, affamant l'analyse pendant toute panne de
     * configuration.
     */
    expect(route).toContain("eq('status', 'rapport_en_attente')");
    expect(route).toContain("eq('status', 'en_attente')");
    expect(route).not.toMatch(/\.in\(\s*['"]status['"],\s*\[\s*['"]en_attente['"]/);
  });

  it('traite le lot de renvois avant la zone à analyser', () => {
    const retryIndex = route.indexOf("eq('status', 'rapport_en_attente')");
    const scanIndex = route.indexOf("eq('status', 'en_attente')");
    expect(retryIndex).toBeGreaterThanOrEqual(0);
    expect(scanIndex).toBeGreaterThan(retryIndex);
  });

  it('borne le lot de renvois, sans limiter l’analyse au même chiffre', () => {
    expect(route).toContain('REPORT_RETRY_BATCH');
    expect(route).toMatch(/const REPORT_RETRY_BATCH = 10;/);
  });

  it('priorise les renvois par ancienneté du premier échec, pas de la zone', () => {
    expect(route).toContain("order('report_first_failed_at', { ascending: true })");
  });
});

describe('pas de repli vers un domaine leurre en production', () => {
  it('n’envoie jamais sans RESEND_API_KEY ni BOOKING_FROM_EMAIL en production', () => {
    expect(route).toContain("if (!apiKey) return { reportSent: false");
    expect(route).toContain('BOOKING_FROM_EMAIL manquante en production');
    expect(route).toMatch(/!isProduction\(\)\s*\?\s*'Qualifyr <onboarding@resend\.dev>'\s*:\s*null/);
  });

  it('vérifie la configuration avant tout appel réseau à Resend', () => {
    const configCheck = route.indexOf("if (!from) return { reportSent: false");
    const send = route.indexOf('resend.emails.send');
    expect(configCheck).toBeGreaterThanOrEqual(0);
    expect(configCheck).toBeLessThan(send);
  });
});

describe('un incident pendant un renvoi ne consomme pas le plafond', () => {
  it('capture les exceptions du lot de renvois sans les laisser interrompre le passage', () => {
    const loopStart = route.indexOf('for (const pending of pendingReports)');
    const catchBlock = route.indexOf('renvoi échoué');
    expect(loopStart).toBeGreaterThanOrEqual(0);
    expect(catchBlock).toBeGreaterThan(loopStart);
  });

  it('remet la zone en rapport_en_attente sans la faire passer en échec ni toucher l’horloge', () => {
    const catchBlockStart = route.indexOf('renvoi échoué');
    const afterCatch = route.slice(catchBlockStart, catchBlockStart + 400);
    expect(afterCatch).toContain("status: 'rapport_en_attente'");
    expect(afterCatch).not.toContain('report_first_failed_at');
    expect(afterCatch).not.toContain('report_attempts');
  });
});

describe('reportHtml n’invente aucune donnée', () => {
  it('accepte uniquement { name, city }, jamais le type Establishment complet', () => {
    expect(route).toContain('type ReportSample');
    expect(route).toMatch(/readonly samples: readonly ReportSample\[\];/);
  });
});

describe('migration 017', () => {
  it('étend la contrainte de statut avec rapport_en_attente, sans retirer les valeurs existantes', () => {
    expect(migration).toContain('drop constraint if exists agent_zones_status_check');
    expect(migration).toMatch(
      /check \(status in \('en_attente', 'en_cours', 'rapport_en_attente', 'termine', 'echec'\)\)/,
    );
  });

  it('ajoute report_first_failed_at, et documente que report_attempts ne pilote plus la décision', () => {
    expect(migration).toContain('report_first_failed_at timestamptz');
    expect(migration).toMatch(/report_attempts.*pour le diagnostic seulement/s);
  });

  it('est idempotente', () => {
    expect(migration).toContain('if not exists');
    expect(migration).toContain('if exists');
  });
});

describe('tableau de bord — le nouveau statut ne s’affiche pas en texte brut', () => {
  it('rapport_en_attente a un libellé et un style de badge', () => {
    expect(prospectionPage).toContain('rapport_en_attente:');
    expect(prospectionPage).toMatch(/status === 'rapport_en_attente'/);
  });
});
