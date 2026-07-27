import { describe, expect, it } from 'vitest';
import { calculateOffer, getRecommendations } from '@/lib/offer-configurator';

describe('calculateOffer', () => {
  it('calcule le socle sur douze mois sans option', () => {
    expect(calculateOffer([])).toEqual({ optionTotal: 0, firstYearTotal: 2278 });
  });

  it('ajoute toutes les options ponctuelles une seule fois', () => {
    expect(calculateOffer(['acompte', 'reservation', 'redaction'])).toEqual({
      optionTotal: 970,
      firstYearTotal: 3248,
    });
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
    const titles = getRecommendations('conciergerie', 'site', 'image', ['redaction']).map((item) => item.title);
    expect(titles).toContain('Des contenus entièrement rédigés');
    expect(titles).not.toContain('Un acompte lorsque la prestation le justifie');
  });
});
