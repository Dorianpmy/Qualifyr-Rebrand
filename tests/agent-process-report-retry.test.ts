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
const migration017 = readFileSync(
  join(ROOT, 'supabase/migrations/017_agent_zones_report_retry.sql'),
  'utf-8',
);
const migration018 = readFileSync(
  join(ROOT, 'supabase/migrations/018_agent_zones_lease.sql'),
  'utf-8',
);
const prospectionPage = readFileSync(
  join(ROOT, 'src/app/app/prospection/page.tsx'),
  'utf-8',
);
const cronComment = readFileSync(
  join(ROOT, 'netlify/functions/agent-process-cron.ts'),
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

  it('traite la zone à analyser avant le lot de renvois', () => {
    /*
     * Inversé volontairement : l'analyse consomme du quota Sirene et ne se
     * rejoue pas, un renvoi ne coûte qu'une requête HTTP et se rejoue sans
     * perte au passage suivant. Si ce passage manque de temps, mieux vaut
     * écourter les renvois que l'analyse déjà payée en quota.
     *
     * Ça ne réintroduit pas la famine corrigée précédemment : celle-ci venait
     * de fusionner les deux files en une seule requête triée par ancienneté
     * (voir le test ci-dessus, qui verrouille toujours l'absence de ce
     * `.in()` commun) — pas de l'ordre dans lequel deux files séparées sont
     * traitées au sein d'un même passage. Les deux continuent d'être
     * traitées à chaque passage, quel que soit l'ordre.
     */
    const scanIndex = route.indexOf("eq('status', 'en_attente')");
    const retryIndex = route.indexOf("eq('status', 'rapport_en_attente')");
    expect(scanIndex).toBeGreaterThanOrEqual(0);
    expect(retryIndex).toBeGreaterThan(scanIndex);
  });

  it('traite le lot de renvois même si l’analyse a échoué', () => {
    // Un incident sur l'analyse ne doit pas retarder des renvois qui n'ont
    // rien à voir avec lui : le retour d'erreur ne doit pas être un `return`
    // précoce qui court-circuiterait le lot de renvois.
    const scanCatch = route.indexOf("console.error('[agent/process] échec'");
    const retryBlock = route.indexOf("eq('status', 'rapport_en_attente')");
    const earlyReturn = route.slice(route.indexOf('scanError = true'), retryBlock);
    expect(scanCatch).toBeGreaterThanOrEqual(0);
    expect(retryBlock).toBeGreaterThan(scanCatch);
    expect(earlyReturn).not.toMatch(/return NextResponse\.json/);
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
    expect(migration017).toContain('drop constraint if exists agent_zones_status_check');
    expect(migration017).toMatch(
      /check \(status in \('en_attente', 'en_cours', 'rapport_en_attente', 'termine', 'echec'\)\)/,
    );
  });

  it('ajoute report_first_failed_at, et documente que report_attempts ne pilote plus la décision', () => {
    expect(migration017).toContain('report_first_failed_at timestamptz');
    expect(migration017).toMatch(/report_attempts.*pour le diagnostic seulement/s);
  });

  it('est idempotente', () => {
    expect(migration017).toContain('if not exists');
    expect(migration017).toContain('if exists');
  });
});

describe('migration 018 — le bail sur en_cours', () => {
  it('ajoute locked_at, idempotente', () => {
    expect(migration018).toContain('add column if not exists locked_at timestamptz');
  });
});

describe('le bail (locked_at) sur une zone en cours', () => {
  it('dure dix minutes, largement au-dessus de maxDuration et sous la cadence du cron', () => {
    expect(route).toMatch(/const MAX_LOCK_MS = 10 \* 60 \* 1000;/);
  });

  it('pose le bail à la prise en charge de la zone d’analyse, sans changer le statut des renvois', () => {
    // La zone d'analyse transite par en_cours ; les renvois restent
    // rapport_en_attente pendant leur traitement, pour qu'une reprise ne
    // confonde jamais les deux files.
    expect(route).toContain("update({ status: 'en_cours', locked_at: now.toISOString() })");
    expect(route).toContain("update({ locked_at: now.toISOString() })");
  });

  it('récupère une zone d’analyse dont le bail a expiré via deux requêtes plates, pas un .or() imbriqué', () => {
    // Risque assumé de ne pas pouvoir vérifier une syntaxe PostgREST
    // imbriquée sans base réelle : deux requêtes .eq()/.lt() simples plutôt
    // qu'un .or('status.eq.en_attente,and(status.eq.en_cours,...))'.
    expect(route).not.toMatch(/\.or\(\s*`status\.eq/);
    expect(route).toContain("eq('status', 'en_cours')");
    expect(route).toContain("lt('locked_at', lockThreshold)");
  });

  it('récupère les renvois dont le bail a expiré, ou jamais posé, par un .or() à plat sur une seule colonne', () => {
    expect(route).toMatch(/\.or\(`locked_at\.is\.null,locked_at\.lt\.\$\{lockThreshold\}`\)/);
  });

  it('relâche le bail dans tous les dénouements possibles d’une zone d’analyse', () => {
    // Succès, échec définitif (JS, pas un processus tué) et rapport en
    // attente doivent tous relâcher `locked_at` : sinon une zone résolue
    // normalement resterait à tort éligible à la relecture de bail expiré.
    const matches = route.match(/locked_at: null/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });
});

describe('garde anti-doublon sur l’insertion des prospects', () => {
  it('vérifie qu’aucun prospect n’existe déjà pour la zone avant d’insérer', () => {
    // Le cas trouvé en revue : une zone récupérée après expiration de son
    // bail peut déjà avoir ses établissements en base (processus tué après
    // l'insertion, avant l'écriture finale du statut). Réinsérer percuterait
    // la contrainte unique (zone_id, siret) et boucherait la zone dans une
    // boucle qui reconsomme du quota Sirene à chaque tentative.
    const insertIndex = route.indexOf("from('agent_prospects').insert(");
    const guardIndex = route.indexOf('alreadyInserted');
    expect(guardIndex).toBeGreaterThanOrEqual(0);
    expect(guardIndex).toBeLessThan(insertIndex);
    expect(route).toMatch(/if \(!alreadyInserted\) \{/);
  });
});

describe('budget de durée de l’analyse — calculé, pas estimé', () => {
  it('douze appels Sirene au maximum, documentés dans route.ts', () => {
    expect(route).toMatch(/douze appels Sirene/);
  });

  it('le commentaire du cron annonce désormais la même durée que la route', () => {
    // La mention historique de « une à deux minutes » peut légitimement
    // rester dans une note « corrigé le … » qui explique l'erreur passée —
    // ce qui compte est que la description active de la durée soit
    // désormais « vingt secondes », partout, pas que la chaîne n'apparaisse
    // plus du tout.
    expect(cronComment).toMatch(/environ vingt secondes/);
    expect(route).toMatch(/environ vingt secondes/);
  });
});

describe('tableau de bord — le nouveau statut ne s’affiche pas en texte brut', () => {
  it('rapport_en_attente a un libellé et un style de badge', () => {
    expect(prospectionPage).toContain('rapport_en_attente:');
    expect(prospectionPage).toMatch(/status === 'rapport_en_attente'/);
  });
});
