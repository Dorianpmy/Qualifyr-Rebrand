/**
 * Moteur d'estimation de revenus en location courte durée.
 *
 * Le calcul repose sur un barème par ville — prix moyen par nuit et taux
 * d'occupation annuel — corrigé par le type de logement, sa capacité et son
 * niveau de finition.
 *
 * **Statut des données.** Les valeurs ci-dessous sont des ordres de grandeur
 * indicatifs servant à ouvrir une conversation, pas une expertise. Elles
 * doivent être recalibrées ville par ville à partir de données réelles avant
 * toute communication chiffrée. Le résultat est toujours présenté sous forme
 * de fourchette, jamais comme un montant unique : c'est ce qui rend l'outil
 * honnête et défendable devant un propriétaire.
 */

export type CityId =
  | 'paris'
  | 'lyon'
  | 'marseille'
  | 'bordeaux'
  | 'nice'
  | 'toulouse'
  | 'nantes'
  | 'lille'
  | 'strasbourg'
  | 'montpellier'
  | 'annecy'
  | 'biarritz';

export type PropertyType = 'studio' | 't2' | 't3' | 'maison';
export type Standing = 'simple' | 'confort' | 'premium';

export type CityBenchmark = {
  readonly id: CityId;
  readonly label: string;
  /** Prix moyen par nuit, base T2 confort pour deux voyageurs. */
  readonly nightlyRate: number;
  /** Taux d'occupation annuel moyen, exprimé entre 0 et 1. */
  readonly occupancy: number;
};

/** Barème indicatif. À recalibrer sur données réelles avant mise en avant. */
export const cityBenchmarks = [
  { id: 'paris', label: 'Paris', nightlyRate: 145, occupancy: 0.72 },
  { id: 'nice', label: 'Nice', nightlyRate: 115, occupancy: 0.66 },
  { id: 'annecy', label: 'Annecy', nightlyRate: 120, occupancy: 0.63 },
  { id: 'biarritz', label: 'Biarritz', nightlyRate: 130, occupancy: 0.6 },
  { id: 'bordeaux', label: 'Bordeaux', nightlyRate: 100, occupancy: 0.63 },
  { id: 'lyon', label: 'Lyon', nightlyRate: 95, occupancy: 0.65 },
  { id: 'marseille', label: 'Marseille', nightlyRate: 95, occupancy: 0.62 },
  { id: 'montpellier', label: 'Montpellier', nightlyRate: 90, occupancy: 0.62 },
  { id: 'strasbourg', label: 'Strasbourg', nightlyRate: 90, occupancy: 0.62 },
  { id: 'toulouse', label: 'Toulouse', nightlyRate: 85, occupancy: 0.6 },
  { id: 'nantes', label: 'Nantes', nightlyRate: 85, occupancy: 0.6 },
  { id: 'lille', label: 'Lille', nightlyRate: 80, occupancy: 0.6 },
] as const satisfies readonly CityBenchmark[];

export const propertyTypes = [
  { id: 'studio', label: 'Studio', factor: 0.88 },
  { id: 't2', label: '2 pièces', factor: 1 },
  { id: 't3', label: '3 pièces', factor: 1.18 },
  { id: 'maison', label: 'Maison', factor: 1.32 },
] as const satisfies readonly { id: PropertyType; label: string; factor: number }[];

export const standings = [
  { id: 'simple', label: 'Simple et fonctionnel', factor: 0.88 },
  { id: 'confort', label: 'Confortable et bien équipé', factor: 1 },
  { id: 'premium', label: 'Haut de gamme', factor: 1.22 },
] as const satisfies readonly { id: Standing; label: string; factor: number }[];

/** Capacités proposées, de deux à huit voyageurs. */
export const capacities = [2, 4, 6, 8] as const;
export type Capacity = (typeof capacities)[number];

export type AmenityId = 'exterieur' | 'parking' | 'clim' | 'piscine';

/**
 * Équipements qui déplacent réellement un revenu locatif.
 *
 * Volontairement peu nombreux : au-delà de quatre cases, le visiteur remplit
 * un formulaire au lieu de découvrir un chiffre. Les coefficients restent
 * prudents — un extérieur améliore un logement, il ne le transforme pas.
 */
export const amenities = [
  { id: 'exterieur', label: 'Terrasse ou balcon', factor: 1.06 },
  { id: 'parking', label: 'Stationnement', factor: 1.04 },
  { id: 'clim', label: 'Climatisation', factor: 1.03 },
  { id: 'piscine', label: 'Piscine', factor: 1.15 },
] as const satisfies readonly { id: AmenityId; label: string; factor: number }[];

function amenitiesFactor(selected: readonly AmenityId[]): number {
  return selected.reduce((total, id) => {
    const amenity = amenities.find((entry) => entry.id === id);
    return amenity ? total * amenity.factor : total;
  }, 1);
}

/** Commission de conciergerie retenue par défaut, moyenne observée du marché. */
export const defaultCommissionRate = 0.2;

/** Amplitude de la fourchette affichée, de part et d'autre de l'estimation. */
const rangeSpread = 0.12;

const daysPerYear = 365;

export type EstimateInput = {
  readonly city: CityId;
  readonly propertyType: PropertyType;
  readonly capacity: Capacity;
  readonly standing: Standing;
  readonly amenities?: readonly AmenityId[];
  readonly commissionRate?: number;
};

export type EstimateResult = {
  /** Prix moyen par nuit retenu après corrections. */
  readonly nightlyRate: number;
  /** Nombre de nuits louées estimé sur douze mois. */
  readonly nightsPerYear: number;
  readonly occupancy: number;
  /** Revenu annuel brut, avant commission et charges. */
  readonly grossLow: number;
  readonly grossHigh: number;
  /** Revenu restant au propriétaire après commission de conciergerie. */
  readonly ownerLow: number;
  readonly ownerHigh: number;
  readonly commissionRate: number;
};

function capacityFactor(capacity: Capacity): number {
  // Le prix ne croît pas proportionnellement au nombre de couchages :
  // le premier lit supplémentaire vaut plus que le quatrième.
  return { 2: 1, 4: 1.34, 6: 1.62, 8: 1.85 }[capacity];
}

function roundToTen(value: number): number {
  return Math.round(value / 10) * 10;
}

function roundToHundred(value: number): number {
  return Math.round(value / 100) * 100;
}

export function getCity(id: CityId): CityBenchmark {
  const city = cityBenchmarks.find((entry) => entry.id === id);
  if (!city) throw new Error(`Ville inconnue : ${id}`);
  return city;
}

export function estimateRevenue({
  city,
  propertyType,
  capacity,
  standing,
  amenities: selectedAmenities = [],
  commissionRate = defaultCommissionRate,
}: EstimateInput): EstimateResult {
  const benchmark = getCity(city);
  const typeFactor = propertyTypes.find((entry) => entry.id === propertyType)?.factor ?? 1;
  const standingFactor = standings.find((entry) => entry.id === standing)?.factor ?? 1;

  const nightlyRate =
    benchmark.nightlyRate *
    typeFactor *
    standingFactor *
    capacityFactor(capacity) *
    amenitiesFactor(selectedAmenities);
  const nightsPerYear = Math.round(daysPerYear * benchmark.occupancy);
  const gross = nightlyRate * nightsPerYear;

  const grossLow = roundToHundred(gross * (1 - rangeSpread));
  const grossHigh = roundToHundred(gross * (1 + rangeSpread));

  return {
    nightlyRate: roundToTen(nightlyRate),
    nightsPerYear,
    occupancy: benchmark.occupancy,
    grossLow,
    grossHigh,
    ownerLow: roundToHundred(grossLow * (1 - commissionRate)),
    ownerHigh: roundToHundred(grossHigh * (1 - commissionRate)),
    commissionRate,
  };
}

export function formatEuros(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(ratio: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(ratio);
}
