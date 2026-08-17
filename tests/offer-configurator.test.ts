import { describe, expect, it } from 'vitest';
import {
  calculateMonthlyEquivalent,
  calculateOffer,
  getOptionPrice,
  getRecommendations,
  pricingByRegion,
  resolvePricingRegion,
  roundUpToTen,
} from '@/lib/offer-configurator';

describe('calculateOffer', () => {
  it('calcule le socle sur douze mois sans option', () => {
    expect(calculateOffer([])).toEqual({ optionTotal: 0, firstYearTotal: 2378 });
  });

  it('ajoute toutes les options ponctuelles une seule fois', () => {
    expect(calculateOffer(['acompte', 'reservation', 'redaction'])).toEqual({
      optionTotal: 970,
      firstYearTotal: 3348,
    });
  });

  it('applique la grille suisse en CHF à tous les montants', () => {
    expect(pricingByRegion.switzerland).toMatchObject({ setupPrice: 690, monthlyPrice: 180, currency: 'CHF' });
    expect(getOptionPrice('acompte', 'switzerland')).toBe(340);
    expect(getOptionPrice('redaction', 'switzerland')).toBe(460);
    expect(calculateOffer([], 'switzerland')).toEqual({ optionTotal: 0, firstYearTotal: 2850 });
    expect(calculateOffer(['acompte', 'reservation', 'redaction'], 'switzerland')).toEqual({
      optionTotal: 1140,
      firstYearTotal: 3990,
    });
  });

  it('répartit le coût complet sans changer le total', () => {
    expect(calculateMonthlyEquivalent(2378)).toBeCloseTo(198.166666, 5);
    expect(calculateMonthlyEquivalent(2850)).toBe(237.5);
  });
});

describe('tarification régionale', () => {
  it('arrondit toujours à la dizaine supérieure', () => {
    expect(roundUpToTen(684.4)).toBe(690);
    expect(roundUpToTen(690)).toBe(690);
  });

  it('présélectionne uniquement la Suisse, avec l’euro comme repli sûr', () => {
    expect(resolvePricingRegion('CH')).toBe('switzerland');
    expect(resolvePricingRegion('ch')).toBe('switzerland');
    expect(resolvePricingRegion('FR')).toBe('euro');
    expect(resolvePricingRegion(null)).toBe('euro');
  });
});

describe('getRecommendations', () => {
  it('adapte le parcours au nettoyage mobile et aux demandes incomplètes', () => {
    const titles = getRecommendations('automobile', 'multicanal', 'incompletes', []).map((item) => item.title);
    expect(titles).toContain('Une zone d’intervention explicite');
    expect(titles).toContain('Une demande mieux préparée');
    expect(titles).not.toContain('Un suivi après la prestation');
  });

  it('ajoute uniquement les briques correspondant aux options choisies', () => {
    const titles = getRecommendations('autre', 'site', 'image', ['redaction']).map((item) => item.title);
    expect(titles).toContain('Des contenus entièrement rédigés');
    expect(titles).not.toContain('Un acompte lorsque la prestation le justifie');
  });
});
