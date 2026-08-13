/**
 * Types du produit detailing automobile — réservation directe avec acompte.
 *
 * Référence : `docs/13-saas-nettoyage-automobile.md`. Aucun type ne dépend de
 * React ni de Supabase : le moteur de devis et le moteur de créneaux doivent
 * pouvoir tourner côté serveur (webhook, tâche planifiée) à partir du même
 * code que la page, comme le moteur d'estimation locative.
 */

export type VehicleSize = 'citadine' | 'berline' | 'suv' | 'utilitaire' | 'prestige';
export type Scope = 'interieur' | 'exterieur' | 'complet';
export type SoilingLevel = 'normal' | 'tres_sale' | 'poils_taches';
export type LocationMode = 'domicile' | 'atelier';
export type OptionKey = 'shampouinage' | 'ceramique' | 'polissage' | 'phares' | 'ozone';

export type BookingStatus =
  | 'en_attente_paiement'
  | 'confirme'
  | 'ajuste'
  | 'realise'
  | 'annule'
  | 'expire';

export const vehicleSizes: readonly VehicleSize[] = [
  'citadine',
  'berline',
  'suv',
  'utilitaire',
  'prestige',
];

export const scopes: readonly Scope[] = ['interieur', 'exterieur', 'complet'];

export const soilingLevels: readonly SoilingLevel[] = ['normal', 'tres_sale', 'poils_taches'];

export const optionKeys: readonly OptionKey[] = [
  'shampouinage',
  'ceramique',
  'polissage',
  'phares',
  'ozone',
];

/** Une ligne de `detailer_prices` : le prix de base pour une formule × un gabarit. */
export type PriceEntry = {
  readonly scope: Scope;
  readonly vehicleSize: VehicleSize;
  readonly basePrice: number;
  readonly baseMinutes: number;
};

/** Une ligne de `detailer_options`, telle que réglée par le professionnel. */
export type OptionEntry = {
  readonly key: OptionKey;
  readonly enabled: boolean;
  readonly price: number;
  readonly minutes: number;
  /** Le prix et la durée suivent le gabarit du véhicule (§2.1 note « pourquoi »). */
  readonly scaleWithSize: boolean;
  /** Le multiplicateur de salissure s'applique à cette option (§2.2). */
  readonly affectedBySoiling: boolean;
};

/** Une ligne de `detailer_soiling`. */
export type SoilingEntry = {
  readonly level: SoilingLevel;
  readonly labourMultiplier: number;
};

/** Ce que le professionnel a réglé dans son back-office « Tarifs ». */
export type DetailerConfig = {
  readonly prices: readonly PriceEntry[];
  readonly options: readonly OptionEntry[];
  readonly soiling: readonly SoilingEntry[];
  readonly travelFreeRadiusKm: number;
  readonly travelFeePerKm: number;
  readonly travelMaxKm: number;
  /** Au-delà, la page annonce une intervention sur deux demi-journées (§2.3). */
  readonly longJobThresholdMinutes: number;
  readonly depositEnabled: boolean;
  /** Entre 0 et 30 — jamais le total (§0.1). */
  readonly depositPercent: number;
};

/** Ce que le client a choisi, écran par écran. */
export type QuoteInput = {
  readonly scope: Scope;
  readonly vehicleSize: VehicleSize;
  readonly soiling: SoilingLevel;
  readonly optionKeys: readonly OptionKey[];
  readonly locationMode: LocationMode;
  /** Distance déclarée par le client, en km. Ignorée si `locationMode` vaut `atelier`. */
  readonly travelKm?: number | undefined;
};

export type QuoteOptionLine = {
  readonly key: OptionKey;
  readonly price: number;
  readonly minutes: number;
};

export type Quote = {
  readonly basePrice: number;
  readonly baseMinutes: number;
  readonly optionLines: readonly QuoteOptionLine[];
  readonly optionsPrice: number;
  readonly optionsMinutes: number;
  readonly soilingMultiplier: number;
  /** (base + options sensibles à la salissure) × multiplicateur, + options insensibles. */
  readonly labourPrice: number;
  /** Arrondie au quart d'heure supérieur (§2.3). */
  readonly labourMinutes: number;
  readonly travelFee: number;
  /** Faux si la distance déclarée dépasse `travelMaxKm` — le parcours doit s'arrêter. */
  readonly travelAllowed: boolean;
  readonly totalPrice: number;
  readonly totalMinutes: number;
  /** Vrai au-delà du seuil réglé par le professionnel. */
  readonly isLongJob: boolean;
  readonly depositAmount: number;
};

/** Un intervalle temporel, borne haute exclue — miroir de `tstzrange`. */
export type TimeRange = {
  readonly start: Date;
  readonly end: Date;
};

/** Une ligne de `detailer_availability`. */
export type WeekdayAvailability = {
  /** 0 = dimanche … 6 = samedi, comme `Date#getDay()`. */
  readonly weekday: number;
  /** `HH:mm`. */
  readonly opensAt: string;
  readonly closesAt: string;
  readonly bufferMinutes: number;
};

/** Une ligne de `detailer_closures`. */
export type Closure = {
  readonly startsAt: Date;
  readonly endsAt: Date;
};

export type AvailabilityConfig = {
  readonly weekly: readonly WeekdayAvailability[];
  readonly closures: readonly Closure[];
  readonly minBookingNoticeHours: number;
  readonly slotGranularityMinutes: number;
};
