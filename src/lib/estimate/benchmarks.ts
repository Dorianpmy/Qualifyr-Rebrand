/**
 * Valeurs de départ des hypothèses modifiables.
 *
 * **Rien ici n'est une vérité de marché.** Ce sont des points de départ
 * plausibles, destinés à être corrigés — par la conciergerie qui configure son
 * espace, puis par le propriétaire lui-même sur la page de résultats. C'est
 * précisément parce qu'elles sont ajustables que ces valeurs peuvent être
 * approximatives sans être malhonnêtes.
 *
 * Les taux publics (frais de plateforme, taxe de séjour) sont isolés ici pour
 * qu'une mise à jour ne demande pas de relire le moteur.
 */

import {
  defaultCommissionRate,
  estimateRevenue,
  getCity,
  type CityId,
} from '@/lib/rental-estimate';
import type { Assumptions, EstimateInput } from './types';

/**
 * Frais de service prélevés par la plateforme de réservation, part hôte.
 * Ordre de grandeur public, à vérifier au moment de l'affichage.
 */
export const platformFeeRate = 0.03;

/**
 * Taxe de séjour, par nuit et par voyageur.
 *
 * Le barème est fixé par chaque commune : cette valeur unique est une
 * approximation prudente, à remplacer par le barème réel de la ville dès que
 * la conciergerie le renseigne.
 */
export const touristTaxPerNightPerGuest = 1.5;

/** Durée moyenne d'un séjour, en nuits. Détermine le nombre de ménages. */
export const defaultAverageStayNights = 3.5;

/**
 * Temps réel d'une rotation, en heures : échanges avec le voyageur, remise des
 * clés, coordination du ménage et du linge, incidents. Volontairement prudent —
 * un chiffre gonflé se retourne contre l'argument.
 */
export const hoursPerBooking = 2.5;

/** Valorisation horaire par défaut, corrigeable par le propriétaire. */
export const defaultHourlyValue = 25;

/**
 * Loyer mensuel indicatif en location classique.
 *
 * À remplacer par la carte des loyers publiée en open data (data.gouv.fr),
 * croisée avec la surface du bien. En attendant, ces ordres de grandeur
 * servent uniquement de valeur initiale d'un champ que le propriétaire corrige
 * — il connaît son loyer, lui.
 */
const longTermMonthlyRent: Readonly<Record<CityId, number>> = {
  paris: 1450,
  nice: 950,
  annecy: 950,
  biarritz: 950,
  bordeaux: 850,
  lyon: 850,
  marseille: 750,
  montpellier: 700,
  strasbourg: 700,
  toulouse: 700,
  nantes: 700,
  lille: 650,
};

/** Hypothèses initiales, déduites du barème de la ville et du bien décrit. */
export function defaultAssumptions(input: EstimateInput): Assumptions {
  const benchmark = getCity(input.city);
  const base = estimateRevenue({
    city: input.city,
    propertyType: input.propertyType,
    capacity: input.capacity,
    standing: input.standing,
    ...(input.amenities ? { amenities: input.amenities } : {}),
  });

  return {
    occupancy: benchmark.occupancy,
    nightlyRate: base.nightlyRate,
    // Le ménage suit la taille du bien : un T3 ne se remet pas en état comme
    // un studio, et facturer un forfait unique fausserait le net.
    cleaningCost: 45 + input.capacity * 5,
    averageStayNights: defaultAverageStayNights,
    commissionRate: defaultCommissionRate,
    longTermMonthlyRent: longTermMonthlyRent[input.city],
    hourlyValue: defaultHourlyValue,
  };
}
