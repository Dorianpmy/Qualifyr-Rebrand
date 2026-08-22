import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Le bouton central de l'espace pro doit toujours mener quelque part.
 *
 * **Ce test naît d'une panne réelle** (22/08/2026). `AppShell` construisait la
 * destination du bouton « Page client » par interpolation :
 * `/reservation/${detailerSlug}`. Sept écrans passent `detailerSlug=""` — ceux
 * où le compte existe mais n'a pas encore de fiche professionnelle. L'adresse
 * devenait donc `/reservation/`, qui n'existait pas : le bouton le plus visible
 * du produit, le seul en relief, envoyait sur une page d'erreur.
 *
 * Rien ne pouvait le signaler. Une chaîne vide est un `string` valide, donc le
 * typage est satisfait ; le gabarit produit une URL syntaxiquement correcte,
 * donc le build passe ; et la page cible n'est résolue qu'à l'exécution.
 *
 * Les deux vérifications ci-dessous sont volontairement différentes. La
 * première lit la source : elle empêche de revenir à une interpolation nue, ce
 * qui est la forme exacte du bug. La seconde vérifie l'existence de la route de
 * repli sur le disque : même bien gardé, un visiteur peut arriver sur
 * `/reservation` par un lien tronqué, et cette adresse doit répondre.
 */

const ROOT = process.cwd();
const APP_SHELL = join(ROOT, 'src/components/app/AppShell.tsx');

describe('bouton « Page client » de l’espace pro', () => {
  it('ne construit jamais l’adresse sans vérifier d’abord le slug', () => {
    const source = readFileSync(APP_SHELL, 'utf-8');

    // La destination interpolée doit exister — sinon le test surveille un
    // bouton qui n'est plus là, et passerait pour de mauvaises raisons.
    expect(source).toContain('`/reservation/${detailerSlug}`');

    /*
     * … mais elle doit être gardée. On cherche une condition sur `detailerSlug`
     * quelque part avant l'interpolation. Le test ne prescrit pas la forme
     * exacte de la garde (ternaire, `&&`, retour anticipé) : imposer une
     * écriture précise ferait échouer une refonte parfaitement correcte.
     */
    const interpolation = source.indexOf('`/reservation/${detailerSlug}`');
    const before = source.slice(0, interpolation);
    const guarded = /detailerSlug\s*(\?|&&|===\s*''|!==\s*''|\)\s*\{)/.test(before);

    expect(
      guarded,
      'AppShell doit vérifier que `detailerSlug` est non vide avant de construire /reservation/<slug> : ' +
        'sept écrans passent une chaîne vide, ce qui produit /reservation/.',
    ).toBe(true);
  });

  it('laisse une route qui répond sur /reservation, sans identifiant', () => {
    const routes = [
      join(ROOT, 'src/app/reservation/page.tsx'),
      join(ROOT, 'src/app/reservation/page.ts'),
    ];

    expect(
      routes.some((route) => existsSync(route) && statSync(route).isFile()),
      '/reservation doit exister : on y arrive par un lien tronqué ou partagé de travers, ' +
        'et la 404 générale ne dit pas quoi faire ensuite.',
    ).toBe(true);
  });

  it('n’a pas d’autre lien vers une route de réservation sans slug', () => {
    /*
     * Le même piège peut réapparaître ailleurs : n'importe quel composant qui
     * écrit `/reservation/` suivi d'une valeur potentiellement vide. On
     * cherche donc la chaîne littérale `"/reservation/"` — une destination
     * fermée sur le slash final, qui ne peut mener nulle part.
     */
    const offenders: string[] = [];

    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(tsx?|jsx?)$/.test(entry)) continue;
        const source = readFileSync(full, 'utf-8');
        if (/href[=:]\s*['"]\/reservation\/['"]/.test(source)) offenders.push(full);
      }
    };

    walk(join(ROOT, 'src'));

    expect(offenders, 'Liens vers /reservation/ sans identifiant').toEqual([]);
  });
});
