'use client';

import { useMemo, useState } from 'react';
import { buildEstimate } from '@/lib/estimate/engine';
import { defaultAssumptions } from '@/lib/estimate/benchmarks';
import type { Assumptions, EstimateInput } from '@/lib/estimate/types';
import { AssumptionControls } from './AssumptionControls';
import { NetBreakdown } from './NetBreakdown';
import { RentalComparison } from './RentalComparison';
import { SeasonalityChart } from './SeasonalityChart';
import styles from './EstimateResult.module.css';
import { ScenarioTriptych } from './ScenarioTriptych';

/**
 * Orchestrateur de la page de résultats — **le seul composant avec état**.
 *
 * Les neuf blocs d'affichage sont purs : ils reçoivent un `EstimateResult`
 * déjà construit et ne calculent rien. Cette discipline permet de générer le
 * document PDF côté serveur depuis le même moteur, et rend le calcul testable
 * sans DOM (`docs/12-page-resultats-estimation.md`, §4).
 *
 * Deux états seulement :
 *
 * - `assumptions` — ce que le propriétaire corrige. C'est le cœur de la page :
 *   un chiffre qu'on a ajusté soi-même cesse d'être une promesse commerciale.
 * - `unlocked` — le mur. Le brut reste libre ; le net, la saisonnalité et la
 *   comparaison se débloquent contre les coordonnées, après que le visiteur a
 *   vu la démonstration commencer.
 *
 * Le recalcul est synchrone et local : aucun aller-retour serveur au mouvement
 * d'un curseur.
 */

type EstimateResultProps = {
  input: EstimateInput;
  /**
   * Hypothèses de la conciergerie, si son espace est configuré. Elles
   * remplacent les valeurs de départ génériques : c'est elle qui connaît son
   * marché, et c'est elle qui assume l'estimation devant le propriétaire.
   */
  overrides?: Partial<Assumptions>;
  /**
   * Démonstration publique : le mur n'a pas lieu d'être sur la vitrine, où
   * l'on cherche à convaincre une conciergerie, pas à capter un propriétaire.
   */
  gated?: boolean;
  onUnlock?: () => void;
};

export function EstimateResult({
  input,
  overrides,
  gated = true,
  onUnlock,
}: EstimateResultProps) {
  const initial = useMemo(
    () => ({ ...defaultAssumptions(input), ...overrides }),
    [input, overrides],
  );

  const [assumptions, setAssumptions] = useState<Assumptions>(initial);
  const [unlocked, setUnlocked] = useState(!gated);

  /**
   * Réinitialisation quand le bien décrit change.
   *
   * `useState(initial)` ne lit sa valeur qu'au montage : sans ce bloc, les
   * hypothèses restaient figées sur la première ville affichée et la cascade
   * contredisait le résumé juste au-dessus — Paris en haut, Lyon en bas.
   *
   * Ajustement pendant le rendu plutôt que dans un effet : React relance le
   * rendu immédiatement, avant peinture, donc l'écran n'affiche jamais l'état
   * périmé. Un `useEffect` aurait laissé passer une image fausse.
   *
   * Les corrections liées au bien sont volontairement perdues : un tarif ou un
   * loyer saisis pour un T2 lyonnais n'ont aucun sens sur une maison à
   * Biarritz.
   *
   * **La commission fait exception et survit.** Elle ne décrit pas le
   * logement mais la politique tarifaire de la conciergerie, qui ne change pas
   * d'un bien à l'autre. La réinitialiser obligerait à la ressaisir à chaque
   * simulation — exactement la friction qui fait abandonner un outil qu'on est
   * en train d'évaluer.
   */
  const [lastInput, setLastInput] = useState(initial);
  if (lastInput !== initial) {
    setLastInput(initial);
    setAssumptions((current) => ({ ...initial, commissionRate: current.commissionRate }));
  }

  const result = useMemo(
    () => buildEstimate(input, assumptions),
    [input, assumptions],
  );

  /**
   * Seules portes d'entrée vers l'état. Aucun bloc d'affichage ne reçoit
   * `setAssumptions` directement : c'est ce qui garantit qu'aucun d'eux ne
   * peut introduire un calcul en douce.
   */

  /** Une hypothèse à la fois : les curseurs sont indépendants. */
  function updateAssumption<K extends keyof Assumptions>(key: K, value: Assumptions[K]) {
    setAssumptions((current) => ({ ...current, [key]: value }));
  }

  function resetAssumptions() {
    setAssumptions(initial);
  }

  function unlock() {
    setUnlocked(true);
    onUnlock?.();
  }
  void unlock;

  return (
    <div className={styles.result} data-estimate-result data-unlocked={unlocked}>
      {/* Blocs restants à écrire :
          0 CalculationReveal · 5 TimeSaved · 7 LeadGate · MethodNote

          Chacun reçoit une part de `result` — jamais `input` ni `assumptions`
          bruts, pour qu'aucun ne soit tenté de recalculer quoi que ce soit. */}
      <ScenarioTriptych scenarios={result.scenarios} referenceId={result.reference.id} />
      <NetBreakdown data={result.net} />
      <RentalComparison data={result.comparison} />
      <SeasonalityChart data={result.seasonality} />
      {/* Placé après les résultats, jamais avant : on montre d'abord un chiffre,
          on propose de le corriger ensuite. L'ordre inverse transformerait la
          page en formulaire de paramétrage. */}
      <AssumptionControls
        assumptions={result.assumptions}
        onChange={updateAssumption}
        onReset={resetAssumptions}
      />
    </div>
  );
}
