import { describe, expect, it } from 'vitest';
import {
  capacities,
  cityBenchmarks,
  defaultCommissionRate,
  estimateRevenue,
  getCity,
  propertyTypes,
  standings,
  type Capacity,
} from '@/lib/rental-estimate';

const base = {
  city: 'lyon',
  propertyType: 't2',
  capacity: 4,
  standing: 'confort',
} as const;

describe('barème', () => {
  it('expose des taux d’occupation plausibles', () => {
    for (const city of cityBenchmarks) {
      expect(city.occupancy).toBeGreaterThan(0.4);
      expect(city.occupancy).toBeLessThan(0.9);
      expect(city.nightlyRate).toBeGreaterThan(0);
    }
  });

  it('échoue explicitement sur une ville inconnue', () => {
    // @ts-expect-error — vérifie le garde-fou à l'exécution.
    expect(() => getCity('lombok')).toThrow();
  });
});

describe('estimateRevenue', () => {
  it('produit une fourchette croissante et cohérente', () => {
    const result = estimateRevenue(base);
    expect(result.grossLow).toBeLessThan(result.grossHigh);
    expect(result.ownerLow).toBeLessThan(result.ownerHigh);
    expect(result.nightsPerYear).toBeGreaterThan(0);
    expect(result.nightsPerYear).toBeLessThanOrEqual(365);
  });

  it('laisse au propriétaire le complément de la commission', () => {
    const result = estimateRevenue(base);
    expect(result.ownerHigh).toBeLessThan(result.grossHigh);
    expect(result.ownerHigh / result.grossHigh).toBeCloseTo(1 - defaultCommissionRate, 1);
  });

  it('augmente le revenu avec la capacité d’accueil', () => {
    const values = capacities.map(
      (capacity: Capacity) => estimateRevenue({ ...base, capacity }).grossHigh,
    );
    const sorted = [...values].sort((left, right) => left - right);
    expect(values).toEqual(sorted);
  });

  it('classe les niveaux de finition dans l’ordre attendu', () => {
    const simple = estimateRevenue({ ...base, standing: 'simple' }).grossHigh;
    const confort = estimateRevenue({ ...base, standing: 'confort' }).grossHigh;
    const premium = estimateRevenue({ ...base, standing: 'premium' }).grossHigh;
    expect(simple).toBeLessThan(confort);
    expect(confort).toBeLessThan(premium);
  });

  it('classe les types de logement dans l’ordre attendu', () => {
    const values = propertyTypes.map(
      (type) => estimateRevenue({ ...base, propertyType: type.id }).grossHigh,
    );
    const sorted = [...values].sort((left, right) => left - right);
    expect(values).toEqual(sorted);
  });

  it('accepte une commission personnalisée', () => {
    const result = estimateRevenue({ ...base, commissionRate: 0.15 });
    expect(result.commissionRate).toBe(0.15);
    expect(result.ownerLow).toBeGreaterThan(estimateRevenue(base).ownerLow);
  });

  it('couvre toutes les combinaisons sans produire de valeur non finie', () => {
    for (const city of cityBenchmarks) {
      for (const type of propertyTypes) {
        for (const standing of standings) {
          for (const capacity of capacities) {
            const result = estimateRevenue({
              city: city.id,
              propertyType: type.id,
              standing: standing.id,
              capacity,
            });
            expect(Number.isFinite(result.grossLow)).toBe(true);
            expect(Number.isFinite(result.grossHigh)).toBe(true);
          }
        }
      }
    }
  });
});
