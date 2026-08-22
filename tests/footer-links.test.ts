import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Chaque lien du pied de page doit mener quelque part.
 *
 * **Ce test naît d'une panne réelle.** Le pied de page sombre est rendu sur
 * sept pages, et son groupe « Produit » ne contenait que des ancres nues
 * (`#agent-title`…). Une ancre nue ne cible que la page courante : ces
 * sections n'existant que sur l'accueil, dix-huit liens ne faisaient
 * strictement rien — dont l'appel à l'action principal, qui ne fonctionnait
 * que sur la seule page où il est inutile.
 *
 * Rien ne l'avait signalé : ni le typage, ni le lint, ni le build. Un lien
 * mort est du HTML parfaitement valide.
 *
 * Le test lit les liens directement dans le composant plutôt que dans une
 * constante exportée : c'est le fichier réellement rendu qui doit être juste,
 * et une liste exportée pour les besoins du test finit toujours par diverger
 * de ce qui est affiché.
 */

const ROOT = process.cwd();
const FOOTER = join(ROOT, 'src/components/agency/DarkFooter.tsx');

/** Toutes les destinations `href="…"` du composant. */
function footerHrefs(): readonly string[] {
  const source = readFileSync(FOOTER, 'utf-8');
  const hrefs = [...source.matchAll(/href[=:]\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!);
  return [...new Set(hrefs)];
}

/** Une route interne correspond-elle à une page du routeur ? */
function routeExists(route: string): boolean {
  const clean = route.split('#')[0]!.split('?')[0]!;
  if (clean === '' || clean === '/') return existsSync(join(ROOT, 'src/app/page.tsx'));
  return existsSync(join(ROOT, 'src/app', clean.replace(/^\//, ''), 'page.tsx'));
}

/** L'ancre existe-t-elle quelque part dans les composants rendus ? */
function anchorExists(anchor: string): boolean {
  const id = anchor.replace(/^\/?#/, '');
  const grep = (dir: string): boolean => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (grep(full)) return true;
      } else if (/\.tsx$/.test(entry)) {
        const source = readFileSync(full, 'utf-8');
        if (source.includes(`id="${id}"`) || source.includes(`labelledBy="${id}"`)) return true;
      }
    }
    return false;
  };
  return grep(join(ROOT, 'src'));
}

describe('liens du pied de page', () => {
  const hrefs = footerHrefs();

  it('le composant expose bien des liens', () => {
    expect(hrefs.length).toBeGreaterThan(5);
  });

  it('aucune ancre nue — elles ne fonctionneraient que sur l’accueil', () => {
    // C'est le défaut d'origine : `#agent-title` au lieu de `/#agent-title`.
    const bare = hrefs.filter((href) => href.startsWith('#'));
    expect(bare, `ancres sans préfixe : ${bare.join(', ')}`).toEqual([]);
  });

  it('chaque route interne correspond à une page existante', () => {
    const broken = hrefs
      .filter((href) => href.startsWith('/') && !href.startsWith('/#'))
      .filter((href) => !routeExists(href));

    expect(broken, `routes introuvables : ${broken.join(', ')}`).toEqual([]);
  });

  it('chaque ancre d’accueil correspond à une section réelle', () => {
    const broken = hrefs
      .filter((href) => href.startsWith('/#'))
      .filter((href) => !anchorExists(href));

    expect(broken, `ancres introuvables : ${broken.join(', ')}`).toEqual([]);
  });

  it('les trois documents légaux sont accessibles depuis le pied de page', () => {
    // Des conditions de vente ne sont opposables que si elles sont
    // atteignables avant l'achat, donc depuis toutes les pages.
    for (const route of [
      '/mentions-legales',
      '/conditions-generales-de-vente',
      '/politique-de-confidentialite',
    ]) {
      expect(hrefs, `manquant : ${route}`).toContain(route);
    }
  });
});
