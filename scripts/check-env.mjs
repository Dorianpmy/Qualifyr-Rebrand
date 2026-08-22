#!/usr/bin/env node
/**
 * Contrôle des variables d'environnement obligatoires.
 *
 * Usage :
 *   npm run check:env              → mode développement
 *   npm run check:env -- --prod    → mode production (exige tout)
 *
 * Sort en code 1 si une variable manque, pour pouvoir servir de garde-fou
 * dans une chaîne de déploiement. **Aucune valeur n'est affichée** : seuls
 * les noms manquants le sont, donc aucun secret ne peut fuir dans un journal
 * de build.
 *
 * Le script lit `.env.local` s'il existe, puis l'environnement du processus —
 * dans cet ordre, comme Next.js.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const production = process.argv.includes('--prod');
const mode = production ? 'production' : 'development';

/** Analyse minimale d'un fichier `.env` : `CLE=valeur`, commentaires ignorés. */
function readEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    out[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }
  return out;
}

const fileEnv = readEnvFile(join(process.cwd(), '.env.local'));
const env = { ...fileEnv, ...process.env };

// Liste dupliquée depuis `src/lib/env-check.ts` : ce script tourne sans
// compilation TypeScript. Un test (`tests/env-check.test.ts`) vérifie que les
// deux listes ne divergent pas.
const REQUIRED = [
  ['NEXT_PUBLIC_SUPABASE_URL', true],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', true],
  ['SUPABASE_SERVICE_ROLE_KEY', true],
  ['STRIPE_SECRET_KEY', false],
  ['STRIPE_BILLING_WEBHOOK_SECRET', false],
  ['STRIPE_WEBHOOK_SECRET', false],
  ['STRIPE_PRICE_AGENT_MONTHLY', false],
  ['STRIPE_PRICE_AGENT_ANNUAL', false],
  ['STRIPE_PRICE_SYSTEME_MONTHLY', false],
  ['STRIPE_PRICE_SYSTEME_ANNUAL', false],
  ['STRIPE_PRICE_COMPLET_MONTHLY', false],
  ['STRIPE_PRICE_COMPLET_ANNUAL', false],
  ['CRON_SECRET', false],
  ['INSEE_API_KEY', false],
  ['RESEND_API_KEY', false],
  ['BOOKING_FROM_EMAIL', false],
];

const missing = REQUIRED.filter(([name, requiredInDev]) => {
  if (mode === 'development' && !requiredInDev) return false;
  const value = env[name];
  return value === undefined || String(value).trim() === '';
}).map(([name]) => name);

if (missing.length === 0) {
  console.warn(`✓ Variables d'environnement complètes (mode ${mode}).`);
  process.exit(0);
}

console.error(`✗ ${missing.length} variable(s) manquante(s) en mode ${mode} :`);
for (const name of missing) console.error(`  - ${name}`);
console.error('\nVoir .env.example pour le rôle de chacune et l’effet de son absence.');
process.exit(1);
