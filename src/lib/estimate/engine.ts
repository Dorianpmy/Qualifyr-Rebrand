/**
 * Moteur d'estimation — pur, synchrone, sans dépendance React.
 *
 * Cette contrainte n'est pas cosmétique : le document PDF envoyé au
 * propriétaire doit être produit côté serveur à partir de **ce** code. Deux
 * implémentations du calcul finiraient par diverger, et c'est le document qui
 * ferait foi devant lui (`docs/12`, §4).
 *
 * Pureté = recalcul instantané à chaque mouvement de curseur, sans aller-retour
 * réseau, et testable sans DOM.
 */

import { monthLabels, seasonalityProfile } from './seasonality';
import {
  hoursPerBooking,
  platformFeeRate,
  touristTaxPerNightPerGuest,
} from './benchmarks';
import type {
  Assumptions,
  EstimateInput,
  EstimateResult,
  NetLine,
  RentalComparison,
  Scenario,
  ScenarioId,
  Seasonality,
  SeasonalityMonth,
  TimeSaved,
} from './types';

const DAYS_PER_YEAR = 365;

function roundToTen(value: number): number {
  return Math.round(value / 10) * 10;
}

/**
 * Les trois scénarios.
 *
 * Un montant unique est toujours faux et se retourne au premier relevé. Trois
 * scénarios disent la vérité — l'incertitude existe — tout en donnant sa place
 * commerciale au troisième : « optimisé » est le résultat avec un
 * professionnel aux commandes, c'est-à-dire ce que vend la conciergerie.
 */
const scenarioShapes: readonly {
  id: ScenarioId;
  label: string;
  rationale: string;
  occupancy: number;
  rate: number;
}[] = [
  {
    id: 'prudent',
    label: 'Prudent',
    rationale: 'Occupation et tarif en dessous du marché, première année.',
    occupancy: 0.85,
    rate: 0.9,
  },
  {
    id: 'realiste',
    label: 'Réaliste',
    rationale: 'Sur la base des hypothèses affichées ci-dessous.',
    occupancy: 1,
    rate: 1,
  },
  {
    id: 'optimise',
    label: 'Optimisé',
    rationale: 'Calendrier tenu, tarification ajustée, annonce travaillée.',
    occupancy: 1.1,
    rate: 1.08,
  },
];

function buildScenario(
  shape: (typeof scenarioShapes)[number],
  assumptions: Assumptions,
): Scenario {
  // Une occupation ne dépasse pas 100 % : sans cette borne, le scénario
  // optimisé d'une ville déjà tendue produirait un chiffre impossible.
  const occupancy = Math.min(assumptions.occupancy * shape.occupancy, 0.95);
  const nightlyRate = roundToTen(assumptions.nightlyRate * shape.rate);
  const nightsPerYear = Math.round(DAYS_PER_YEAR * occupancy);

  return {
    id: shape.id,
    label: shape.label,
    rationale: shape.rationale,
    nightlyRate,
    occupancy,
    nightsPerYear,
    gross: Math.round(nightlyRate * nightsPerYear),
  };
}

/**
 * La cascade des retenues.
 *
 * C'est le bloc que personne n'affiche : les simulateurs concurrents annoncent
 * un brut flatteur, et le propriétaire découvre le reste au premier relevé.
 * Montrer le net *avant* la signature achète une confiance qu'aucun argument
 * ne remplace.
 */
function buildNet(scenario: Scenario, assumptions: Assumptions, capacity: number) {
  const bookings = Math.round(scenario.nightsPerYear / assumptions.averageStayNights);

  const platformFee = Math.round(scenario.gross * platformFeeRate);
  const cleaning = Math.round(bookings * assumptions.cleaningCost);
  const touristTax = Math.round(
    scenario.nightsPerYear * capacity * touristTaxPerNightPerGuest,
  );
  const commission = Math.round(scenario.gross * assumptions.commissionRate);

  // Une division par zéro reste possible : occupation nulle, tarif nul. Sans
  // ce garde-fou, toute la cascade s'afficherait en `NaN`.
  const share = (amount: number) => (scenario.gross > 0 ? amount / scenario.gross : 0);

  const lines: readonly NetLine[] = [
    {
      id: 'gross',
      label: 'Revenus bruts',
      detail: `${scenario.nightsPerYear} nuits à ${scenario.nightlyRate} €`,
      amount: scenario.gross,
      kind: 'income',
      share: 1,
    },
    {
      id: 'platform',
      label: 'Frais de plateforme',
      detail: `${Math.round(platformFeeRate * 100)} % des réservations`,
      amount: platformFee,
      kind: 'deduction',
      share: share(platformFee),
    },
    {
      id: 'cleaning',
      label: 'Ménage et linge',
      detail: `${bookings} séjours à ${assumptions.cleaningCost} €`,
      amount: cleaning,
      kind: 'deduction',
      share: share(cleaning),
    },
    {
      id: 'tax',
      label: 'Taxe de séjour',
      detail: 'Collectée puis reversée à la commune',
      amount: touristTax,
      kind: 'deduction',
      share: share(touristTax),
    },
    {
      id: 'commission',
      label: 'Commission de conciergerie',
      detail: `${Math.round(assumptions.commissionRate * 100)} % des revenus`,
      amount: commission,
      kind: 'deduction',
      share: share(commission),
    },
  ];

  const deducted = platformFee + cleaning + touristTax + commission;
  const net = Math.max(scenario.gross - deducted, 0);

  return {
    breakdown: {
      lines,
      net: Math.round(net),
      netShare: share(net),
      deducted: Math.round(deducted),
    },
    bookings,
  };
}

/**
 * Le seuil de bascule.
 *
 * Le propriétaire ne se demande pas « combien ça rapporte » mais « est-ce que
 * ça vaut mieux que mon locataire actuel ». Ce taux lui donne un critère de
 * décision au lieu d'une promesse.
 *
 * Résolu par balayage plutôt qu'algébriquement : les retenues ne sont pas
 * toutes proportionnelles au brut — le ménage suit le nombre de séjours, la
 * taxe suit les nuitées — donc l'équation n'est pas linéaire.
 */
function findBreakEven(
  assumptions: Assumptions,
  capacity: number,
  longTermNet: number,
): number | null {
  for (let occupancy = 0.05; occupancy <= 0.95; occupancy += 0.01) {
    const probe = buildScenario(
      { ...scenarioShapes[1]!, occupancy: occupancy / assumptions.occupancy },
      assumptions,
    );
    if (buildNet(probe, assumptions, capacity).breakdown.net >= longTermNet) {
      return Math.round(occupancy * 100) / 100;
    }
  }
  // Aucun taux ne suffit : le taire reviendrait à laisser croire l'inverse.
  return null;
}

/**
 * Saisonnalité mensuelle.
 *
 * Les seuils d'intensité sont volontairement larges — ±15 % autour de la
 * moyenne — pour qu'un profil urbain, presque plat, ne se retrouve pas
 * arbitrairement coupé en hauts et bas. Sur une année étale, tous les mois
 * doivent rester « moyens » : inventer un contraste que la donnée ne porte pas
 * serait un mensonge graphique.
 */
function buildSeasonality(input: EstimateInput, scenario: Scenario): Seasonality {
  const profile = seasonalityProfile(input.city);
  const highestWeight = Math.max(...profile);

  const months: readonly SeasonalityMonth[] = profile.map((weight, index) => ({
    month: index + 1,
    label: monthLabels[index]!,
    share: weight / 12,
    gross: Math.round((scenario.gross * weight) / 12),
    height: highestWeight > 0 ? weight / highestWeight : 0,
    intensity: weight >= 1.15 ? 'high' : weight <= 0.85 ? 'low' : 'mid',
  }));

  const sorted = [...months].sort((a, b) => b.gross - a.gross);

  return {
    months,
    peak: sorted[0]!,
    low: sorted[sorted.length - 1]!,
    topThreeShare: sorted.slice(0, 3).reduce((total, month) => total + month.share, 0),
    lowSeasonGross: months
      .filter((month) => month.intensity === 'low')
      .reduce((total, month) => total + month.gross, 0),
  };
}

function buildTimeSaved(bookings: number, assumptions: Assumptions): TimeSaved {
  const hours = Math.round(bookings * hoursPerBooking);
  return {
    bookingsPerYear: bookings,
    hours,
    value: Math.round(hours * assumptions.hourlyValue),
  };
}

export function buildEstimate(
  input: EstimateInput,
  assumptions: Assumptions,
): EstimateResult {
  const scenarios = scenarioShapes.map((shape) => buildScenario(shape, assumptions)) as
    unknown as readonly [Scenario, Scenario, Scenario];

  const reference = scenarios[1];
  const { breakdown, bookings } = buildNet(reference, assumptions, input.capacity);

  const longTermNet = Math.round(assumptions.longTermMonthlyRent * 12);
  // Échelle commune aux deux barres : sans elle, chaque barre serait relative à
  // elle-même et la comparaison visuelle mentirait.
  const highest = Math.max(breakdown.net, longTermNet, 1);
  const comparison: RentalComparison = {
    shortTermNet: breakdown.net,
    longTermNet,
    difference: breakdown.net - longTermNet,
    shortTermShare: breakdown.net / highest,
    longTermShare: longTermNet / highest,
    breakEvenOccupancy: findBreakEven(assumptions, input.capacity, longTermNet),
  };

  return {
    scenarios,
    reference,
    net: breakdown,
    comparison,
    seasonality: buildSeasonality(input, reference),
    timeSaved: buildTimeSaved(bookings, assumptions),
    assumptions,
  };
}
