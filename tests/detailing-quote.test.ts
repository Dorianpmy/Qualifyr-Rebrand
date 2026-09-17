import { describe, expect, it } from 'vitest';
import { quote } from '@/lib/detailing/quote';
import type { DetailerConfig } from '@/lib/detailing/types';

/**
 * Config de test — reprend la structure de `detailer_prices` /
 * `detailer_options` / `detailer_soiling` telle que réglée par un
 * professionnel (docs/13-saas-nettoyage-automobile.md, §1).
 */
const baseConfig: DetailerConfig = {
  prices: [
    { scope: 'complet', vehicleSize: 'berline', basePrice: 80, baseMinutes: 120 },
    { scope: 'complet', vehicleSize: 'citadine', basePrice: 60, baseMinutes: 90 },
    { scope: 'complet', vehicleSize: 'suv', basePrice: 100, baseMinutes: 150 },
    { scope: 'interieur', vehicleSize: 'berline', basePrice: 40, baseMinutes: 95 },
  ],
  options: [
    {
      key: 'shampouinage',
      enabled: true,
      price: 30,
      minutes: 45,
      scaleWithSize: false,
      affectedBySoiling: true,
    },
    {
      key: 'ceramique',
      enabled: true,
      price: 150,
      minutes: 90,
      scaleWithSize: true,
      affectedBySoiling: false,
    },
  ],
  soiling: [
    { level: 'normal', labourMultiplier: 1 },
    { level: 'tres_sale', labourMultiplier: 1.25 },
    { level: 'poils_taches', labourMultiplier: 1.45 },
  ],
  travelFreeRadiusKm: 10,
  travelFeePerKm: 1.5,
  travelMaxKm: 40,
  longJobThresholdMinutes: 240,
  depositEnabled: true,
  depositPercent: 20,
};

describe('quote — base et durée', () => {
  it('retourne le prix et la durée de base sans option ni salissure', () => {
    const result = quote(
      { scope: 'complet', vehicleSize: 'berline', soiling: 'normal', optionKeys: [], locationMode: 'atelier' },
      baseConfig,
    );
    expect(result.totalPrice).toBe(80);
    expect(result.totalMinutes).toBe(120);
    expect(result.isLongJob).toBe(false);
  });

  it('arrondit la durée au quart d’heure supérieur', () => {
    const result = quote(
      { scope: 'interieur', vehicleSize: 'berline', soiling: 'normal', optionKeys: [], locationMode: 'atelier' },
      baseConfig,
    );
    // 95 minutes ne tombe pas sur un quart d'heure : arrondi à 105.
    expect(result.totalMinutes).toBe(105);
  });
});

describe('quote — multiplicateur de salissure sélectif (§2.2)', () => {
  it('applique le multiplicateur à la base et aux options sensibles, pas aux autres', () => {
    const result = quote(
      {
        scope: 'complet',
        vehicleSize: 'berline',
        soiling: 'tres_sale',
        optionKeys: ['shampouinage', 'ceramique'],
        locationMode: 'atelier',
      },
      baseConfig,
    );
    // (base 80 + shampouinage 30) × 1.25 = 137.5, + céramique 150 (coefficient berline = 1)
    expect(result.labourPrice).toBeCloseTo(287.5);
    expect(result.totalPrice).toBeCloseTo(287.5);
  });

  it('ne fait pas varier le prix de la céramique seule avec le niveau de salissure', () => {
    const normal = quote(
      { scope: 'complet', vehicleSize: 'berline', soiling: 'normal', optionKeys: ['ceramique'], locationMode: 'atelier' },
      baseConfig,
    );
    const soiled = quote(
      {
        scope: 'complet',
        vehicleSize: 'berline',
        soiling: 'poils_taches',
        optionKeys: ['ceramique'],
        locationMode: 'atelier',
      },
      baseConfig,
    );
    expect(normal.optionsPrice).toBe(soiled.optionsPrice);
  });
});

describe('quote — options qui suivent le gabarit', () => {
  it('donne un prix différent pour la céramique selon le gabarit du véhicule', () => {
    const suv = quote(
      { scope: 'complet', vehicleSize: 'suv', soiling: 'normal', optionKeys: ['ceramique'], locationMode: 'atelier' },
      baseConfig,
    );
    const citadine = quote(
      {
        scope: 'complet',
        vehicleSize: 'citadine',
        soiling: 'normal',
        optionKeys: ['ceramique'],
        locationMode: 'atelier',
      },
      baseConfig,
    );
    expect(suv.optionsPrice).toBeGreaterThan(citadine.optionsPrice);
  });
});

describe('quote — long job', () => {
  it('signale une intervention au-delà du seuil réglé par le professionnel', () => {
    const result = quote(
      {
        scope: 'complet',
        vehicleSize: 'suv',
        soiling: 'normal',
        optionKeys: ['ceramique'],
        locationMode: 'atelier',
      },
      baseConfig,
    );
    expect(result.totalMinutes).toBeGreaterThan(baseConfig.longJobThresholdMinutes);
    expect(result.isLongJob).toBe(true);
  });
});

describe('quote — déplacement (§2.7)', () => {
  it('n’ajoute rien dans le rayon offert', () => {
    const result = quote(
      { scope: 'complet', vehicleSize: 'berline', soiling: 'normal', optionKeys: [], locationMode: 'domicile', travelKm: 5 },
      baseConfig,
    );
    expect(result.travelFee).toBe(0);
    expect(result.travelAllowed).toBe(true);
  });

  it('facture le tarif au km au-delà du rayon offert', () => {
    const result = quote(
      { scope: 'complet', vehicleSize: 'berline', soiling: 'normal', optionKeys: [], locationMode: 'domicile', travelKm: 20 },
      baseConfig,
    );
    expect(result.travelFee).toBeCloseTo(15);
  });

  it('refuse une distance au-delà du maximum réglé', () => {
    const result = quote(
      { scope: 'complet', vehicleSize: 'berline', soiling: 'normal', optionKeys: [], locationMode: 'domicile', travelKm: 50 },
      baseConfig,
    );
    expect(result.travelAllowed).toBe(false);
  });
});

describe('quote — acompte', () => {
  it('calcule l’acompte à partir du pourcentage réglé', () => {
    const result = quote(
      { scope: 'complet', vehicleSize: 'berline', soiling: 'normal', optionKeys: [], locationMode: 'atelier' },
      baseConfig,
    );
    expect(result.depositAmount).toBeCloseTo(16);
  });

  it('plafonne l’acompte à 30 % même si le professionnel a réglé plus', () => {
    const result = quote(
      { scope: 'complet', vehicleSize: 'berline', soiling: 'normal', optionKeys: [], locationMode: 'atelier' },
      { ...baseConfig, depositPercent: 50 },
    );
    expect(result.depositAmount).toBeCloseTo(24); // 30 % de 80, jamais 50 %
  });

  it('ne facture aucun acompte si le professionnel ne l’a pas activé', () => {
    const result = quote(
      { scope: 'complet', vehicleSize: 'berline', soiling: 'normal', optionKeys: [], locationMode: 'atelier' },
      { ...baseConfig, depositEnabled: false },
    );
    expect(result.depositAmount).toBe(0);
  });
});

/**
 * Gabarit moto (17/09/2026) : une moto n'a en général qu'une seule formule
 * réglée (« complet », voir `docs/13-...md` §1) — le professionnel ne remplit
 * pas les cases intérieur/extérieur, qui n'ont pas de sens pour un deux-roues.
 */
describe('quote — gabarit moto', () => {
  const motoConfig: DetailerConfig = {
    ...baseConfig,
    prices: [...baseConfig.prices, { scope: 'complet', vehicleSize: 'moto', basePrice: 20, baseMinutes: 30 }],
  };

  it('chiffre une moto sur sa seule formule réglée', () => {
    const result = quote(
      { scope: 'complet', vehicleSize: 'moto', soiling: 'normal', optionKeys: [], locationMode: 'atelier' },
      motoConfig,
    );
    expect(result.totalPrice).toBe(20);
    expect(result.totalMinutes).toBe(30);
  });

  it('refuse un devis pour une formule non réglée sur ce gabarit', () => {
    expect(() =>
      quote(
        { scope: 'interieur', vehicleSize: 'moto', soiling: 'normal', optionKeys: [], locationMode: 'atelier' },
        motoConfig,
      ),
    ).toThrow();
  });
});

/** Option désinfection habitacle (17/09/2026) — forfait fixe, sensible à la salissure comme l'ozone. */
describe('quote — option désinfection', () => {
  const configWithDesinfection: DetailerConfig = {
    ...baseConfig,
    options: [
      ...baseConfig.options,
      {
        key: 'desinfection',
        enabled: true,
        price: 10,
        minutes: 20,
        scaleWithSize: false,
        affectedBySoiling: true,
      },
    ],
  };

  it('ajoute le forfait désinfection sans le faire varier avec le gabarit', () => {
    const berline = quote(
      { scope: 'complet', vehicleSize: 'berline', soiling: 'normal', optionKeys: ['desinfection'], locationMode: 'atelier' },
      configWithDesinfection,
    );
    const suv = quote(
      { scope: 'complet', vehicleSize: 'suv', soiling: 'normal', optionKeys: ['desinfection'], locationMode: 'atelier' },
      configWithDesinfection,
    );
    expect(berline.optionsPrice).toBe(10);
    expect(suv.optionsPrice).toBe(10);
  });

  it('applique le multiplicateur de salissure au forfait désinfection', () => {
    const result = quote(
      {
        scope: 'complet',
        vehicleSize: 'berline',
        soiling: 'tres_sale',
        optionKeys: ['desinfection'],
        locationMode: 'atelier',
      },
      configWithDesinfection,
    );
    // (base 80 + désinfection 10) × 1.25
    expect(result.labourPrice).toBeCloseTo(112.5);
  });
});
