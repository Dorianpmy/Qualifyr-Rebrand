/**
 * Types du moteur d'estimation étendu.
 *
 * Le moteur historique (`src/lib/rental-estimate.ts`) reste la source des
 * barèmes et du calcul de revenu brut. Ce module l'enveloppe pour produire ce
 * que la page de résultats doit afficher : trois scénarios, la cascade nette,
 * la comparaison avec la location classique, la saisonnalité et le temps.
 *
 * Aucun type ne dépend de React : le moteur doit tourner côté serveur pour
 * générer le document PDF à partir du même code que la page
 * (`docs/12-page-resultats-estimation.md`, §4).
 */

import type {
  AmenityId,
  Capacity,
  CityId,
  PropertyType,
  Standing,
} from '@/lib/rental-estimate';

/** Ce que décrit le propriétaire. Ne change pas après la saisie. */
export type EstimateInput = {
  readonly city: CityId;
  readonly propertyType: PropertyType;
  readonly capacity: Capacity;
  readonly standing: Standing;
  readonly amenities?: readonly AmenityId[];
};

/**
 * Ce que le propriétaire peut corriger lui-même.
 *
 * C'est le cœur de la page : un chiffre qu'on a ajusté soi-même cesse d'être
 * une promesse commerciale pour devenir sa propre estimation. L'objection
 * « vos calculs sont optimistes » disparaît avec ce bloc.
 */
export type Assumptions = {
  /** Entre 0 et 1. Corrige le barème de la ville. */
  readonly occupancy: number;
  /** En euros. Corrige le tarif calculé à partir du barème. */
  readonly nightlyRate: number;
  /** Coût ménage et linge, par séjour. */
  readonly cleaningCost: number;
  /** Durée moyenne d'un séjour, en nuits. Détermine le nombre de séjours. */
  readonly averageStayNights: number;
  /** Commission de la conciergerie, entre 0 et 1. */
  readonly commissionRate: number;
  /** Loyer mensuel en location classique, pour la comparaison. */
  readonly longTermMonthlyRent: number;
  /** Valorisation horaire choisie par le propriétaire, pour le temps passé. */
  readonly hourlyValue: number;
};

export type ScenarioId = 'prudent' | 'realiste' | 'optimise';

export type Scenario = {
  readonly id: ScenarioId;
  readonly label: string;
  /** Ce que le scénario suppose, en une phrase, affichée sous le montant. */
  readonly rationale: string;
  readonly nightlyRate: number;
  readonly occupancy: number;
  readonly nightsPerYear: number;
  readonly gross: number;
};

/** Une ligne de la cascade. `amount` est toujours positif ; `kind` porte le signe. */
export type NetLine = {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly amount: number;
  readonly kind: 'income' | 'deduction';
  /**
   * Part du revenu brut, entre 0 et 1.
   *
   * Calculée ici et non dans le composant : les blocs d'affichage ne font
   * aucune arithmétique, pas même une règle de trois — sans quoi le document
   * PDF et la page finiraient par afficher des proportions différentes.
   */
  readonly share: number;
};

export type NetBreakdown = {
  readonly lines: readonly NetLine[];
  /** Ce qui reste au propriétaire, une fois toutes les retenues appliquées. */
  readonly net: number;
  /** Part du brut qui reste au propriétaire, entre 0 et 1. */
  readonly netShare: number;
  /** Total des retenues, pour l'affichage du contraste brut / net. */
  readonly deducted: number;
};

export type RentalComparison = {
  /** Net annuel en courte durée, après toutes retenues. */
  readonly shortTermNet: number;
  /**
   * Loyer annuel perçu en location classique, **avant charges**.
   *
   * La comparaison est donc volontairement défavorable à la courte durée : on
   * lui retire tous ses coûts, on n'en retire aucun à la location classique,
   * qui en supporte pourtant — vacance locative, gestion, impayés. Un
   * simulateur qui penche contre le produit qu'il vend est le seul qu'on
   * croie ; l'interface doit le dire explicitement.
   */
  readonly longTermNet: number;
  /** Écart annuel, positif quand la courte durée l'emporte. */
  readonly difference: number;
  /** Part de la barre la plus longue, entre 0 et 1, pour l'affichage. */
  readonly shortTermShare: number;
  readonly longTermShare: number;
  /**
   * Taux d'occupation à partir duquel la courte durée dépasse la location
   * classique. `null` quand aucun taux n'y suffit — cas réel dans les villes
   * où le loyer est élevé et le tarif de nuit bas ; le taire serait mentir.
   */
  readonly breakEvenOccupancy: number | null;
};

export type SeasonalityMonth = {
  /** 1 à 12. */
  readonly month: number;
  readonly label: string;
  /** Part du revenu annuel, entre 0 et 1. */
  readonly share: number;
  readonly gross: number;
  /** Hauteur de la barre, entre 0 et 1, relative au meilleur mois. */
  readonly height: number;
  /**
   * Position du mois par rapport à la moyenne annuelle.
   *
   * Sert l'argument commercial : les creux sont les mois où une conciergerie
   * professionnelle change réellement le résultat. Les pics, eux, se remplissent
   * seuls — les mettre en avant ne prouve rien.
   */
  readonly intensity: 'high' | 'mid' | 'low';
};

export type Seasonality = {
  readonly months: readonly SeasonalityMonth[];
  readonly peak: SeasonalityMonth;
  readonly low: SeasonalityMonth;
  /** Part du revenu annuel concentrée sur les trois meilleurs mois. */
  readonly topThreeShare: number;
  /** Revenu annuel perdu si les mois creux restaient vides. */
  readonly lowSeasonGross: number;
};

export type TimeSaved = {
  readonly bookingsPerYear: number;
  readonly hours: number;
  readonly value: number;
};

export type EstimateResult = {
  readonly scenarios: readonly [Scenario, Scenario, Scenario];
  /** Scénario de référence, celui sur lequel tout le reste est calculé. */
  readonly reference: Scenario;
  readonly net: NetBreakdown;
  readonly comparison: RentalComparison;
  readonly seasonality: Seasonality;
  readonly timeSaved: TimeSaved;
  readonly assumptions: Assumptions;
};
