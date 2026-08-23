import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Garde-fou contre le retour des promesses retirées.
 *
 * L'audit de vérification du 22/08/2026 a montré la limite d'une correction
 * ponctuelle : « Filtrage » et « Mémoire » avaient survécu dans deux
 * composants, et `PricingTable` — code mort, donc invisible en relecture —
 * gardait intactes les deux promesses les plus fausses du site. Corriger les
 * fichiers qu'on regarde ne suffit pas ; il faut que le dépôt entier refuse
 * ces formulations.
 *
 * Ce test parcourt tout `src/` et échoue sur la moindre réapparition, y
 * compris dans un fichier que personne n'importe. Il balaie aussi les
 * commentaires : c'est volontaire — les commentaires de ce projet expliquent
 * *pourquoi* une formulation a été retirée, et doivent donc citer la phrase
 * fautive. Chaque motif porte donc une liste d'exceptions explicites, ce qui
 * oblige à justifier toute occurrence conservée plutôt qu'à l'ignorer.
 */

const SRC = join(process.cwd(), 'src');

/** Formulations interdites, et ce qu'elles annonçaient à tort. */
const FORBIDDEN: readonly {
  readonly pattern: RegExp;
  readonly why: string;
}[] = [
  {
    pattern: /rendez-vous trouvés par l['’]agent/i,
    why: 'l’agent ne crée aucune réservation (aucun lien agent_prospects → detailer_bookings)',
  },
  {
    pattern: /toutes vos communes/i,
    why: 'nearbyPostalCodes() couvre le code postal ±1, et ignore le rayon en km',
  },
  {
    pattern: /l['’]agent IA|agent d['’]intelligence artificielle/i,
    why: 'aucun modèle de langage n’est appelé dans le projet',
  },
  {
    pattern: /chaque refus lui apprend|il apprend votre terrain/i,
    why: 'aucun mécanisme de rétroaction n’existe',
  },
  {
    /*
     * `le premier message part sans vous` a été **retiré** de cette liste le
     * 22/08/2026 : c'est devenu vrai. Hermès envoie réellement, en différé,
     * au nom du professionnel (voir `lib/agent/outreach.ts`).
     *
     * `il répond avant vous` reste interdit, et la nuance est importante :
     * Hermès envoie un premier message sortant, il ne répond à rien. Aucun
     * traitement des réponses n'existe — elles arrivent directement chez le
     * professionnel, par `replyTo`.
     */
    pattern: /il répond avant vous|répond automatiquement aux réponses/i,
    why: 'Hermès envoie un premier message ; aucune réponse entrante n’est traitée',
  },
  {
    /*
     * Conservé, et la nuance vaut d'être dite : Hermès écrit, mais tout ce qui
     * suit — relancer, appeler, négocier, se déplacer — reste au
     * professionnel. « Vous n'avez plus à démarcher » promettrait que le
     * travail commercial disparaît, ce qui est faux.
     */
    pattern: /vous n['’]avez plus à démarcher|plus rien à faire/i,
    why: 'Hermès envoie le premier message ; les relances et les appels restent à faire',
  },
];

/**
 * Occurrences tolérées : uniquement les commentaires qui documentent le
 * retrait. Le chemin **et** le motif doivent correspondre, pour qu'un fichier
 * exempté ne le soit pas pour toutes les formulations à la fois.
 */
const ALLOWED: readonly { readonly file: string; readonly reason: string }[] = [
  { file: 'src/components/agency/DarkPricing.tsx', reason: 'commentaire de correction' },
  { file: 'src/components/agency/AgentGrid.tsx', reason: 'commentaire de correction' },
  { file: 'src/components/agency/AgentFlow.tsx', reason: 'commentaire de correction' },
  { file: 'src/components/agency/TrustStrip.tsx', reason: 'commentaire de correction' },
  { file: 'src/components/agency/services-content.tsx', reason: 'commentaire de correction' },
  {
    file: 'src/components/agency/FeatureComparisonTable.tsx',
    reason: 'commentaire de correction',
  },
  { file: 'src/app/fonctionnalites/page.tsx', reason: 'commentaire de correction' },
  { file: 'src/app/page.tsx', reason: 'commentaire de correction' },
  { file: 'src/components/agency/ServiceStack.tsx', reason: 'commentaire de correction' },
  { file: 'src/components/agency/PricingTable.tsx', reason: 'commentaire de correction' },
];

function walk(dir: string): readonly string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('les promesses retirées ne reviennent pas', () => {
  const files = walk(SRC);

  it('parcourt bien l’arborescence source', () => {
    // Si ce test tombe à zéro fichier, les suivants passeraient sans rien
    // vérifier — l'échec le plus silencieux qui soit.
    expect(files.length).toBeGreaterThan(50);
  });

  for (const { pattern, why } of FORBIDDEN) {
    it(`aucune occurrence de ${pattern} — ${why}`, () => {
      const hits: string[] = [];

      for (const file of files) {
        const relative = file.slice(process.cwd().length + 1);
        if (ALLOWED.some((entry) => entry.file === relative)) continue;

        const lines = readFileSync(file, 'utf-8').split('\n');
        lines.forEach((line, index) => {
          if (pattern.test(line)) hits.push(`${relative}:${index + 1} — ${line.trim()}`);
        });
      }

      expect(hits, hits.join('\n')).toEqual([]);
    });
  }
});
