/**
 * Courbe de saisonnalité mensuelle.
 *
 * **Statut des données.** Ce sont des profils indicatifs, construits sur des
 * régimes touristiques connus — littoral estival, montagne hivernale, ville
 * d'affaires étale. Ils ne proviennent d'aucune source achetée et ne
 * prétendent pas à la précision : leur rôle est de montrer *la forme* de
 * l'année, pas de prédire un mois.
 *
 * En production, chaque conciergerie abonnée doit pouvoir remplacer ces
 * profils par le sien : elle connaît sa saison mieux que n'importe quelle
 * moyenne nationale, et c'est elle qui assume l'estimation devant le
 * propriétaire (`docs/12`, §3).
 *
 * Chaque profil somme à 12 : un mois vaut 1 quand il est dans la moyenne.
 */

import type { CityId } from '@/lib/rental-estimate';

export const monthLabels = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
] as const;

type Profile = readonly [
  number, number, number, number, number, number,
  number, number, number, number, number, number,
];

function normalise(weights: Profile): Profile {
  const total = weights.reduce((sum, value) => sum + value, 0);
  return weights.map((value) => (value * 12) / total) as unknown as Profile;
}

/** Littoral : l'année se joue sur juillet et août. */
const seaside = normalise([0.5, 0.5, 0.7, 0.9, 1.1, 1.4, 2.1, 2.1, 1.3, 0.8, 0.4, 0.4]);

/** Montagne : deux saisons, un creux marqué au printemps et à l'automne. */
const mountain = normalise([1.6, 1.7, 1.4, 0.7, 0.5, 0.9, 1.5, 1.5, 0.8, 0.5, 0.5, 1.4]);

/** Ville d'affaires et de tourisme urbain : année étale, creux en août. */
const city = normalise([0.7, 0.8, 1.0, 1.1, 1.2, 1.2, 1.1, 0.8, 1.2, 1.1, 0.9, 0.7]);

/** Grande ville touristique : moins creuse en août qu'une ville d'affaires. */
const capital = normalise([0.7, 0.8, 1.0, 1.1, 1.2, 1.3, 1.3, 1.1, 1.2, 1.1, 0.8, 0.7]);

const profiles: Readonly<Record<CityId, Profile>> = {
  paris: capital,
  nice: seaside,
  biarritz: seaside,
  marseille: seaside,
  montpellier: seaside,
  annecy: mountain,
  lyon: city,
  bordeaux: city,
  toulouse: city,
  nantes: city,
  lille: city,
  strasbourg: city,
};

/** Poids mensuels de la ville, normalisés autour de 1. */
export function seasonalityProfile(cityId: CityId): Profile {
  return profiles[cityId];
}
