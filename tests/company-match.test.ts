import { describe, expect, it } from 'vitest';

import { meaningfulTokens, namesLikelyMatch, normalizeCompanyName } from '../src/lib/agent/company-match';

/**
 * Rapprochement Sirene / OpenStreetMap — de vrais couples de noms, pas des
 * cas synthétiques. Le doute doit trancher contre le rapprochement : les cas
 * « ne matche pas » comptent autant que les cas « matche ».
 */

describe('normalizeCompanyName', () => {
  it('retire la casse, les accents et la forme juridique', () => {
    expect(normalizeCompanyName('GARAGE MARTIN SARL')).toBe('garage martin');
  });

  it('retire une forme juridique en mot entier, jamais en sous-chaîne', () => {
    // « sa » en sous-chaîne couperait la fin de « Lisa ».
    expect(normalizeCompanyName('Garage Lisa')).toBe('garage lisa');
    expect(normalizeCompanyName('Lisa SA')).toBe('lisa');
  });

  it('retire la ponctuation', () => {
    expect(normalizeCompanyName("Garage de l'Étoile")).toBe('garage de l etoile');
  });
});

describe('meaningfulTokens', () => {
  it('exclut les mots génériques du secteur', () => {
    expect(meaningfulTokens('garage auto services')).toEqual([]);
  });

  it('garde les mots distinctifs', () => {
    expect(meaningfulTokens('garage martin carrosserie')).toEqual(['martin', 'carrosserie']);
  });
});

describe('namesLikelyMatch', () => {
  const cases: readonly { readonly a: string; readonly b: string; readonly expected: boolean; readonly why: string }[] = [
    {
      a: 'GARAGE MARTIN SARL',
      b: 'Garage Martin',
      expected: true,
      why: 'identique après normalisation',
    },
    {
      a: 'ETS LEFEBVRE AUTOMOBILES',
      b: 'Lefebvre Automobiles',
      expected: true,
      why: 'Dice élevé une fois la forme juridique et les mots génériques retirés',
    },
    {
      a: 'SARL DURAND PNEUS',
      b: 'Durand Pneus Service',
      expected: true,
      why: 'tokens du plus court entièrement contenus dans le plus long',
    },
    {
      a: 'Garage Martin',
      b: 'Garage Martin Carrosserie Peinture',
      expected: true,
      why: 'containment malgré un nom OSM plus descriptif — Dice seul rejetterait ce cas',
    },
    {
      a: 'RENAULT RETAIL GROUP LYON',
      b: 'Renault Lyon Sud',
      expected: false,
      why: "l'effet enseigne : le nom d'une franchise ne suffit pas à confirmer l'identité exacte",
    },
    {
      a: 'GARAGE DU PONT',
      b: 'Garage de la Gare',
      expected: false,
      why: 'aucun token significatif commun, seulement des mots génériques',
    },
    {
      a: 'Europcar Location',
      b: 'Hertz France',
      expected: false,
      why: 'deux enseignes différentes, ne doivent jamais matcher',
    },
    {
      a: '',
      b: 'Garage Martin',
      expected: false,
      why: 'un nom vide ne matche jamais rien',
    },
  ];

  for (const { a, b, expected, why } of cases) {
    it(`« ${a || '(vide)'} » / « ${b} » → ${expected ? 'match' : 'pas de match'} (${why})`, () => {
      expect(namesLikelyMatch(a, b)).toBe(expected);
    });
  }

  it('est symétrique', () => {
    for (const { a, b, expected } of cases) {
      expect(namesLikelyMatch(b, a)).toBe(expected);
    }
  });
});
