import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

/*
 * `server-only` lève une erreur dès qu'il est importé hors d'une compilation
 * Next.js — ce que fait `import-prospects.ts` (et `osm-enrich.ts`, qu'il
 * importe). Neutralisé ici pour ce seul fichier de test, comme dans
 * `osm-enrich.test.ts`.
 */
vi.mock('server-only', () => ({}));

import {
  IMPORT_ATTESTATION_TEXT,
  MAX_IMPORT_SIZE,
  MAX_TOTAL_IMPORTED_PROSPECTS,
  validateImportText,
} from '../src/lib/agent/import-prospects';

/**
 * Import de listes de prospects — Hermès (migration 022).
 *
 * `validateImportText` est pure (ni réseau ni base) : exécutée pour de vrai.
 * `importProspects`, `listImportedProspects` et les fonctions de suppression,
 * qui touchent la base, sont vérifiées par lecture de code, même principe que
 * `fetchRelevanceScores` (`relevance.ts`) ou `nextCandidates` (`outreach.ts`).
 */

describe('validateImportText', () => {
  it('accepte une ligne bien formée', () => {
    const { accepted, rejected } = validateImportText('Garage Durand, contact@garage-durand.fr');
    expect(rejected).toEqual([]);
    expect(accepted).toEqual([{ line: 1, name: 'Garage Durand', email: 'contact@garage-durand.fr' }]);
  });

  it('accepte le point-virgule comme séparateur', () => {
    const { accepted } = validateImportText('Garage Durand;contact@garage-durand.fr');
    expect(accepted).toHaveLength(1);
  });

  it('normalise l’adresse en minuscules', () => {
    const { accepted } = validateImportText('Garage Durand, Contact@Garage-Durand.FR');
    expect(accepted[0]?.email).toBe('contact@garage-durand.fr');
  });

  it('rejette une ligne sans séparateur, avec le numéro de ligne', () => {
    const { accepted, rejected } = validateImportText('juste un nom sans adresse');
    expect(accepted).toEqual([]);
    expect(rejected).toEqual([{ line: 1, raw: 'juste un nom sans adresse', reason: expect.any(String) }]);
  });

  it('rejette une adresse mal formée', () => {
    const { rejected } = validateImportText('Garage Durand, pas-une-adresse');
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toMatch(/mal formée/);
  });

  it('rejette une adresse technique de la liste noire', () => {
    const { rejected } = validateImportText('Garage Durand, no-reply@garage-durand.fr');
    expect(rejected).toHaveLength(1);
  });

  it('rejette un nom vide', () => {
    const { rejected } = validateImportText(', contact@garage-durand.fr');
    expect(rejected).toHaveLength(1);
  });

  it('rejette un doublon dans le même import, en gardant la première occurrence', () => {
    const { accepted, rejected } = validateImportText(
      'Garage Durand, contact@garage-durand.fr\nAutre nom, contact@garage-durand.fr',
    );
    expect(accepted).toHaveLength(1);
    expect(accepted[0]?.line).toBe(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.line).toBe(2);
    expect(rejected[0]?.reason).toMatch(/doublon/);
  });

  it('ignore les lignes vides et numérote sur les lignes non vides seulement', () => {
    const { accepted } = validateImportText('\nGarage Durand, contact@garage-durand.fr\n\n');
    expect(accepted).toEqual([{ line: 1, name: 'Garage Durand', email: 'contact@garage-durand.fr' }]);
  });

  it('ne perd silencieusement aucune ligne : accepté + rejeté = lignes non vides', () => {
    const raw = [
      'Garage Durand, contact@garage-durand.fr',
      'pas une ligne valide',
      'Transports Petit, contact@transports-petit.fr',
      'Autre, pas-une-adresse',
    ].join('\n');
    const { accepted, rejected } = validateImportText(raw);
    expect(accepted.length + rejected.length).toBe(4);
  });
});

describe('IMPORT_ATTESTATION_TEXT', () => {
  it('porte les trois affirmations distinctes', () => {
    expect(IMPORT_ATTESTATION_TEXT).toMatch(/moyen licite/);
    expect(IMPORT_ATTESTATION_TEXT).toMatch(/entreprises.*jamais.*particuliers/s);
    expect(IMPORT_ATTESTATION_TEXT).toMatch(/responsable du traitement/);
    expect(IMPORT_ATTESTATION_TEXT).toMatch(/sous-traitant/);
  });

  it('ne suggère plus de pistes d’obtention — l’affirmation reste nue', () => {
    // Retiré le 24/08/2026 : « recherche publique » pouvait couvrir un
    // annuaire dont les conditions interdisent l'extraction, et se lisait
    // comme une autorisation plutôt qu'un engagement.
    expect(IMPORT_ATTESTATION_TEXT).not.toMatch(/recherche publique/);
    expect(IMPORT_ATTESTATION_TEXT).not.toMatch(/relation commerciale/);
    expect(IMPORT_ATTESTATION_TEXT).not.toMatch(/réseau professionnel/);
  });
});

describe('garde-fous du code', () => {
  const ROOT = process.cwd();
  const source = readFileSync(join(ROOT, 'src/lib/agent/import-prospects.ts'), 'utf-8');

  it('ne collecte pas de numéro de téléphone', () => {
    // Hermès n'appelle personne sur une liste importée ; une donnée sans
    // finalité n'est pas collectée « au cas où ». Le mot « téléphone »
    // apparaît dans les commentaires (pour expliquer ce choix) : c'est un
    // champ `phone` réellement écrit ou sélectionné qui serait le problème.
    expect(source).not.toMatch(/\bphone[:'"]/);
  });

  it('ne supprime jamais une attestation', () => {
    // La preuve doit survivre à la suppression des adresses qu'elle
    // couvrait — voir la migration 022. `agent_import_attestations` n'est
    // touchée qu'une fois dans tout le fichier, et c'est un insert.
    const references = source.match(/\.from\('agent_import_attestations'\)/g) ?? [];
    expect(references).toHaveLength(1);
    expect(source).toContain(".from('agent_import_attestations')\n    .insert");
    expect(source).not.toMatch(/agent_import_attestations'\)[^;]*\.delete/s);
  });

  it('vérifie les deux plafonds avant d’écrire une seule ligne', () => {
    const insertIndex = source.indexOf(".from('agent_import_attestations')\n    .insert");
    const importCap = source.indexOf('accepted.length + rejected.length > MAX_IMPORT_SIZE');
    const totalCapCheck = source.indexOf('> MAX_TOTAL_IMPORTED_PROSPECTS');
    expect(insertIndex).toBeGreaterThanOrEqual(0);
    expect(importCap).toBeGreaterThanOrEqual(0);
    expect(importCap).toBeLessThan(insertIndex);
    expect(totalCapCheck).toBeGreaterThanOrEqual(0);
    expect(totalCapCheck).toBeLessThan(insertIndex);
    expect(source.indexOf('existingCount')).toBeLessThan(insertIndex);
  });

  it('vérifie le propriétaire à la suppression, jamais seulement dans l’appelant', () => {
    expect(source).toContain("eq('id', prospectId)");
    expect(source).toContain("eq('owner_id', ownerId)");
  });

  it('reste sous le plafond total annoncé au professionnel dans l’interface', () => {
    expect(MAX_TOTAL_IMPORTED_PROSPECTS).toBe(2_000);
    expect(MAX_IMPORT_SIZE).toBe(500);
  });
});
