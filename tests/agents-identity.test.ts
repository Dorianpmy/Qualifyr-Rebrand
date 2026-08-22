import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { agents, agentById } from '../src/content/agents';

/**
 * L'identité visuelle des agents doit rester cohérente et vérifiable.
 *
 * **Le risque n'est pas théorique.** Le céladon `#b8dcd0` s'était répandu sur
 * soixante-dix-sept points du projet, écrit en dur, parce qu'aucun endroit ne
 * faisait autorité sur sa valeur. Il a fallu une recherche par teinte pour le
 * retrouver, et trois passes pour l'éliminer. `content/agents.ts` est
 * maintenant cet endroit — encore faut-il que la valeur qu'il déclare soit
 * bien celle que le CSS applique.
 *
 * TypeScript ne peut pas lire une variable CSS et le CSS ne peut pas importer
 * un module TypeScript : les deux valeurs sont nécessairement dupliquées. La
 * seule protection possible est un test qui les compare, et c'est ce que fait
 * le premier bloc.
 */

const ROOT = process.cwd();
const TAILWIND = readFileSync(join(ROOT, 'src/styles/tailwind.css'), 'utf-8');

describe('identité des agents', () => {
  it('déclare trois agents distincts', () => {
    expect(agents).toHaveLength(3);
    expect(new Set(agents.map((a) => a.id)).size).toBe(3);
    expect(new Set(agents.map((a) => a.color)).size).toBe(3);
    expect(new Set(agents.map((a) => a.label)).size).toBe(3);
  });

  it('garde chaque couleur synchronisée avec son jeton CSS', () => {
    for (const agent of agents) {
      /*
       * Le jeton est déclaré deux fois dans `tailwind.css` — dans `@theme`
       * pour produire les utilitaires, et dans `:root` pour les modules CSS.
       * Les deux doivent porter la même valeur, sinon un composant et son
       * voisin afficheraient deux teintes pour le même agent.
       */
      const declarations = [...TAILWIND.matchAll(new RegExp(`${agent.token}:\\s*([^;]+);`, 'g'))].map(
        (m) => m[1]!.trim().toLowerCase(),
      );

      expect(
        declarations.length,
        `${agent.token} doit être déclaré dans @theme ET dans :root`,
      ).toBeGreaterThanOrEqual(2);

      for (const declared of declarations) {
        expect(declared, `${agent.token} diverge de content/agents.ts`).toBe(
          agent.color.toLowerCase(),
        );
      }
    }
  });

  it('n’emploie aucune teinte jaune ou orange', () => {
    /*
     * Contrainte tenue par Dorian depuis le début du projet, et redemandée
     * dans le brief de charte. On la vérifie sur la teinte réelle plutôt que
     * sur des noms de couleurs, qui laissent passer les valeurs en dur.
     */
    for (const agent of agents) {
      const hex = agent.color.replace('#', '');
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
        number,
        number,
        number,
      ];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;

      // Teinte en degrés ; une couleur quasi grise n'a pas de teinte utile.
      let hue = 0;
      if (delta > 0.001) {
        if (max === r) hue = ((g - b) / delta) % 6;
        else if (max === g) hue = (b - r) / delta + 2;
        else hue = (r - g) / delta + 4;
        hue = (hue * 60 + 360) % 360;
      }

      const isWarmYellowOrange = delta > 0.05 && hue >= 20 && hue <= 70;
      expect(isWarmYellowOrange, `${agent.id} (${agent.color}) tombe dans le jaune/orange`).toBe(
        false,
      );
    }
  });

  it('ne promet pas de trouver des clients dans le libellé public', () => {
    /*
     * L'agent interroge un répertoire d'entreprises et envoie un rapport. Le
     * mot « acquisition » reste le vocabulaire interne — il nomme le jeton
     * CSS — mais annoncer une acquisition au visiteur promet un résultat que
     * l'agent ne produit pas. C'est exactement la classe de promesse relevée
     * par l'audit de pré-production.
     */
    expect(agentById.acquisition.label.toLowerCase()).not.toContain('acquisition');
    expect(agentById.acquisition.label.toLowerCase()).toContain('recensement');
  });
});

describe('logo de la marque', () => {
  const BRAND_ASSET = '/images/brand/qualifyr-lockup.png';

  it('est réellement affiché par l’en-tête et le pied de page sombres', () => {
    /*
     * Le vrai logo existait depuis longtemps, mais `components/ui/Logo`
     * n'était utilisé que par l'en-tête et le pied de page **clairs**, ceux
     * que `[data-legacy-chrome]` masque sur toute page sombre. Résultat : le
     * logo de la marque n'apparaissait nulle part sur le site visible, et les
     * deux composants réellement rendus écrivaient « Qualifyr » en gras.
     */
    for (const file of [
      'src/components/agency/DarkHeader.tsx',
      'src/components/agency/DarkFooter.tsx',
    ]) {
      const source = readFileSync(join(ROOT, file), 'utf-8');
      expect(source, `${file} doit importer le composant Logo`).toContain(
        "from '@/components/ui/Logo'",
      );
      expect(source, `${file} doit rendre <Logo`).toMatch(/<Logo[\s/>]/);
    }
  });

  it('pointe vers un fichier de marque qui existe', () => {
    const logoCss = readFileSync(join(ROOT, 'src/components/ui/Logo.module.css'), 'utf-8');
    expect(logoCss).toContain(BRAND_ASSET);

    // `?v=2` et autres paramètres de cache sont tolérés côté CSS ; le fichier
    // lui-même doit exister sur le disque.
    expect(() => readFileSync(join(ROOT, 'public', BRAND_ASSET))).not.toThrow();
  });
});
