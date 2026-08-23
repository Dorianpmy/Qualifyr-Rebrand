import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { REQUIRED_ENV } from '../src/lib/env-check';

/**
 * `REQUIRED_ENV` a oublié trois variables (`CONTACT_TO_EMAIL`,
 * `CONTACT_FROM_EMAIL`, `RESEND_WEBHOOK_SECRET`) pendant des semaines, et
 * personne ne l'a su : `npm run check:env` répondait « tout va bien » alors
 * que les formulaires de contact et d'estimation répondaient 503 en
 * production. Un recensement qu'on maintient à la main dérive toujours de la
 * réalité du code — ce test compare les deux mécaniquement, à chaque
 * exécution de la suite, plutôt qu'à la prochaine relecture.
 *
 * **Ce qu'il vérifie.** Toute variable d'environnement lue quelque part dans
 * `src/` ou `netlify/` doit être classée : soit dans `REQUIRED_ENV` (sa
 * disparition casse quelque chose en production), soit dans `OPTIONAL_ENV`
 * ci-dessous, avec la raison pour laquelle son absence est sans danger. Une
 * variable qui n'apparaît dans aucune des deux fait échouer le test — c'est
 * la propriété recherchée : le jour où quelqu'un lit une nouvelle variable
 * sans la classer, la suite s'arrête avant que ça ne devienne un `?? 'valeur
 * plausible'` non recensé.
 *
 * **Comment les noms sont trouvés.** Deux motifs suffisent à couvrir toutes
 * les façons dont ce dépôt lit une variable : l'accès `process.env.NOM`, et
 * tout littéral entre guillemets qui ressemble à un nom de variable
 * (`MAJUSCULES_AVEC_UNDERSCORE`) — ce second motif couvre aussi bien
 * `process.env['NOM']` que les enveloppes locales `read('NOM')` /
 * `readEnv('NOM')` (trois définitions différentes dans ce dépôt, voir
 * `lib/env.ts`, `lib/detailing/env.ts`, `lib/detailing/email.ts`) sans avoir
 * à connaître leurs noms à l'avance. Vérifié sans faux positif sur l'état
 * actuel du dépôt : uniquement de vrais noms de variables en ressortent.
 */

const ROOT = process.cwd();
const SCAN_DIRS = ['src', 'netlify'];
const FILE_EXTENSIONS = ['.ts', '.tsx'];

const DOT_ACCESS = /process\.env\.([A-Z][A-Z0-9_]*)/g;
const QUOTED_LITERAL = /['"]([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)['"]/g;

function listSourceFiles(dir: string): readonly string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...listSourceFiles(full));
    } else if (FILE_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

function scanEnvNames(): ReadonlySet<string> {
  const names = new Set<string>();
  for (const dir of SCAN_DIRS) {
    for (const file of listSourceFiles(join(ROOT, dir))) {
      const content = readFileSync(file, 'utf-8');
      for (const match of content.matchAll(DOT_ACCESS)) names.add(match[1] as string);
      for (const match of content.matchAll(QUOTED_LITERAL)) names.add(match[1] as string);
    }
  }
  return names;
}

/**
 * Variables volontairement absentes de `REQUIRED_ENV`, avec la raison.
 * Chaque entrée doit correspondre soit à une dégradation visible (jamais un
 * faux succès), soit à une variable qui n'est pas une configuration
 * applicative — fournie par le runtime ou par la plateforme d'hébergement.
 */
const OPTIONAL_ENV: Readonly<Record<string, string>> = {
  NODE_ENV: "fournie par le runtime Node, jamais par l'opérateur du site.",
  URL: "injectée par Netlify au déploiement ; son repli (`?? 'https://qualifyragence.com'`, dans les quatre fonctions planifiées) pointe déjà vers le vrai domaine de production, pas vers un leurre.",
  NEXT_PUBLIC_SITE_URL:
    'repli sur `productionUrl`, le vrai domaine de production — pas un leurre (voir `siteUrl()` dans `lib/env.ts`).',
  NEXT_PUBLIC_SITE_INDEXABLE: 'absente ⇒ le site se déclare non indexable, le défaut le plus sûr.',
  GOOGLE_SITE_VERIFICATION:
    'absente ⇒ la balise de vérification est simplement omise (inclusion conditionnelle, aucun repli).',
  NEXT_PUBLIC_QUALIFYR_BOOKING_URL:
    'canal commercial facultatif ; absente ou invalide ⇒ `null`, le lien correspondant ne s’affiche pas (voir `content/agency-channels.ts`).',
  NEXT_PUBLIC_QUALIFYR_WHATSAPP_NUMBER: 'même repli que `NEXT_PUBLIC_QUALIFYR_BOOKING_URL`, vers `null`.',
  WHATSAPP_TOKEN:
    "absente ⇒ l'envoi est désactivé explicitement (`{ ok: false, reason: 'non_configuré' }`), jamais bloquant pour le professionnel (voir `lib/detailing/whatsapp.ts`).",
  WHATSAPP_PHONE_NUMBER_ID: 'même repli que `WHATSAPP_TOKEN`.',
  BOOKING_NOTIFY_EMAIL:
    "secours pour notifier le professionnel si sa fiche n'a pas d'adresse ; absente ⇒ `null` explicite, avertissement journalisé, aucun envoi tenté (voir `lib/detailing/email.ts`).",
};

describe('REQUIRED_ENV contre la réalité du code', () => {
  it('classe toute variable lue dans src/ ou netlify/, sans exception', () => {
    const found = scanEnvNames();
    const required = new Set(REQUIRED_ENV.map((r) => r.name));

    const unclassified = [...found].filter(
      (name) => !required.has(name) && !(name in OPTIONAL_ENV),
    );

    expect(
      unclassified,
      `Variable(s) lues dans le code mais absentes à la fois de REQUIRED_ENV et ` +
        `d'OPTIONAL_ENV : ${unclassified.join(', ')}. Classez-les dans l'un ou l'autre ` +
        `avant de continuer — c'est exactement le trou qui a laissé passer ` +
        `CONTACT_FROM_EMAIL.`,
    ).toEqual([]);
  });

  it('ne classe pas deux fois la même variable', () => {
    // Une entrée présente à la fois dans REQUIRED_ENV et OPTIONAL_ENV serait
    // ambiguë : laquelle des deux décrit sa vraie conséquence ?
    const required = new Set(REQUIRED_ENV.map((r) => r.name));
    const overlap = Object.keys(OPTIONAL_ENV).filter((name) => required.has(name));
    expect(overlap).toEqual([]);
  });

  it('détecte au moins les variables connues, preuve que le scan n’est pas silencieusement vide', () => {
    // Garde-fou du test lui-même : si `scanEnvNames` se mettait à ne plus
    // rien trouver (motif cassé, chemin de scan erroné…), les deux tests
    // ci-dessus passeraient à tort, faute de matière à comparer.
    const found = scanEnvNames();
    expect(found.has('CRON_SECRET')).toBe(true);
    expect(found.has('STRIPE_SECRET_KEY')).toBe(true);
    expect(found.has('HERMES_FROM_EMAIL')).toBe(true);
    expect(found.size).toBeGreaterThan(20);
  });
});
