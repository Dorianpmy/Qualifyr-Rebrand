/**
 * Moteur de devis — pur, synchrone, sans dépendance React ni Supabase.
 *
 * Le devis envoyé au client et celui recalculé côté serveur au moment de la
 * réservation doivent provenir de **ce** code : c'est ce qui permet au serveur
 * de rejeter une tentative de manipulation du prix envoyé par le client
 * (`docs/13-saas-nettoyage-automobile.md`, §2).
 *
 * La durée est calculée avant le prix et gouverne les créneaux proposés
 * (`availability.ts`) : c'est la contrainte qui structure tout ce module.
 */

import type {
  DetailerConfig,
  OptionEntry,
  OptionKey,
  Quote,
  QuoteInput,
  QuoteOptionLine,
  VehicleSize,
} from './types';

/**
 * Coefficients de gabarit appliqués aux options marquées `scale_with_size`.
 *
 * Le prix de base dispose de sa propre grille par gabarit, réglée directement
 * par le professionnel (`detailer_prices`) — voir §1 pour la raison de ce
 * choix. Les options n'ont qu'un seul prix réglé par le professionnel ; ces
 * coefficients dérivent le prix et la durée sur le gabarit choisi. Ce sont des
 * valeurs par défaut du moteur, pas un réglage exposé au professionnel : la
 * doc ne prévoit pas de grille dédiée aux options.
 */
const optionSizeCoefficient: Record<VehicleSize, number> = {
  citadine: 0.85,
  berline: 1,
  suv: 1.25,
  utilitaire: 1.15,
  prestige: 1.35,
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Arrondi au quart d'heure supérieur — jamais une fausse précision (§2.3). */
function roundMinutesUp(minutes: number): number {
  return Math.ceil(minutes / 15) * 15;
}

function findPrice(config: DetailerConfig, input: QuoteInput) {
  const entry = config.prices.find(
    (price) => price.scope === input.scope && price.vehicleSize === input.vehicleSize,
  );
  if (!entry) {
    throw new Error(
      `Aucun tarif réglé pour la formule « ${input.scope} » et le gabarit « ${input.vehicleSize} ».`,
    );
  }
  return entry;
}

function findSoilingMultiplier(config: DetailerConfig, input: QuoteInput): number {
  const entry = config.soiling.find((soiling) => soiling.level === input.soiling);
  return entry?.labourMultiplier ?? 1;
}

function resolveOptions(
  config: DetailerConfig,
  input: QuoteInput,
): { readonly entry: OptionEntry; readonly key: OptionKey }[] {
  const requested = new Set(input.optionKeys);
  return config.options
    .filter((option) => option.enabled && requested.has(option.key))
    .map((entry) => ({ entry, key: entry.key }));
}

/**
 * Calcule le devis : durée d'abord, prix ensuite (§0.3), en respectant le
 * partage salissure-sensible / salissure-insensible de chaque option (§2.2).
 */
export function quote(input: QuoteInput, config: DetailerConfig): Quote {
  const priceEntry = findPrice(config, input);
  const soilingMultiplier = findSoilingMultiplier(config, input);
  const resolved = resolveOptions(config, input);

  const optionLines: QuoteOptionLine[] = resolved.map(({ entry }) => {
    const factor = entry.scaleWithSize ? optionSizeCoefficient[input.vehicleSize] : 1;
    return {
      key: entry.key,
      price: roundMoney(entry.price * factor),
      minutes: Math.round(entry.minutes * factor),
    };
  });

  const optionsPrice = roundMoney(optionLines.reduce((total, line) => total + line.price, 0));
  const optionsMinutes = optionLines.reduce((total, line) => total + line.minutes, 0);

  // Le multiplicateur ne s'applique qu'à la base et aux options qui y sont
  // sensibles ; les options insensibles (céramique, polissage, phares) sont
  // ajoutées après coup, à leur prix plein (§2.2).
  const affected = resolved.filter(({ entry }) => entry.affectedBySoiling);
  const unaffected = resolved.filter(({ entry }) => !entry.affectedBySoiling);

  const affectedOptionsPrice = roundMoney(
    affected.reduce((total, { entry }) => {
      const factor = entry.scaleWithSize ? optionSizeCoefficient[input.vehicleSize] : 1;
      return total + entry.price * factor;
    }, 0),
  );
  const unaffectedOptionsPrice = roundMoney(
    unaffected.reduce((total, { entry }) => {
      const factor = entry.scaleWithSize ? optionSizeCoefficient[input.vehicleSize] : 1;
      return total + entry.price * factor;
    }, 0),
  );

  const affectedOptionsMinutes = affected.reduce((total, { entry }) => {
    const factor = entry.scaleWithSize ? optionSizeCoefficient[input.vehicleSize] : 1;
    return total + Math.round(entry.minutes * factor);
  }, 0);
  const unaffectedOptionsMinutes = unaffected.reduce((total, { entry }) => {
    const factor = entry.scaleWithSize ? optionSizeCoefficient[input.vehicleSize] : 1;
    return total + Math.round(entry.minutes * factor);
  }, 0);

  const labourPrice = roundMoney(
    (priceEntry.basePrice + affectedOptionsPrice) * soilingMultiplier + unaffectedOptionsPrice,
  );
  const labourMinutesRaw =
    (priceEntry.baseMinutes + affectedOptionsMinutes) * soilingMultiplier +
    unaffectedOptionsMinutes;
  const labourMinutes = roundMinutesUp(labourMinutesRaw);

  const travelKm = input.locationMode === 'domicile' ? Math.max(0, input.travelKm ?? 0) : 0;
  const travelAllowed = input.locationMode === 'atelier' || travelKm <= config.travelMaxKm;
  const travelFee =
    input.locationMode === 'domicile'
      ? roundMoney(Math.max(0, travelKm - config.travelFreeRadiusKm) * config.travelFeePerKm)
      : 0;

  const totalPrice = roundMoney(labourPrice + travelFee);
  const totalMinutes = labourMinutes;

  const depositAmount = config.depositEnabled
    ? roundMoney((totalPrice * Math.min(config.depositPercent, 30)) / 100)
    : 0;

  return {
    basePrice: priceEntry.basePrice,
    baseMinutes: priceEntry.baseMinutes,
    optionLines,
    optionsPrice,
    optionsMinutes,
    soilingMultiplier,
    labourPrice,
    labourMinutes,
    travelFee,
    travelAllowed,
    totalPrice,
    totalMinutes,
    isLongJob: totalMinutes > config.longJobThresholdMinutes,
    depositAmount,
  };
}
