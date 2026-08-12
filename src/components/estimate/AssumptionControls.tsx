'use client';

import { useId } from 'react';
import { formatEuros, formatPercent } from '@/lib/rental-estimate';
import type { Assumptions } from '@/lib/estimate/types';
import styles from './AssumptionControls.module.css';

/**
 * Bloc 6 — les hypothèses, corrigées par le lecteur.
 *
 * **C'est le bloc qui retourne l'objection.** Devant un simulateur, un
 * professionnel pense d'abord « vos barèmes sont faux pour ma ville », et un
 * propriétaire pense « vos chiffres sont optimistes ». Dans les deux cas,
 * l'estimation est rejetée avant d'être lue. Rendre les hypothèses ajustables
 * répond aux deux en trois secondes : le résultat cesse d'être notre promesse
 * pour devenir leur calcul.
 *
 * Le composant ne calcule rien et ne détient aucun état : il lit les
 * hypothèses courantes et remonte chaque correction à `EstimateResult`, seul
 * détenteur. Le moteur étant pur et synchrone, le recalcul est immédiat —
 * aucun aller-retour réseau pendant qu'un curseur bouge.
 */

type Field = {
  readonly key: keyof Assumptions;
  readonly label: string;
  readonly hint: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly format: (value: number) => string;
};

const fields: readonly Field[] = [
  {
    key: 'nightlyRate',
    label: 'Prix moyen par nuit',
    hint: 'Le vôtre, pas une moyenne nationale.',
    min: 30,
    max: 600,
    step: 5,
    format: (value) => `${value} €`,
  },
  {
    key: 'occupancy',
    label: 'Taux d’occupation',
    hint: 'Part de l’année où le logement est loué.',
    min: 0.2,
    max: 0.95,
    step: 0.01,
    format: formatPercent,
  },
  {
    key: 'commissionRate',
    label: 'Commission de conciergerie',
    hint: 'Ce que prélève la conciergerie sur les revenus.',
    min: 0.1,
    max: 0.35,
    step: 0.01,
    format: formatPercent,
  },
  {
    key: 'cleaningCost',
    label: 'Ménage et linge, par séjour',
    hint: 'Refacturé au voyageur ou pris sur les revenus.',
    min: 0,
    max: 200,
    step: 5,
    format: (value) => `${value} €`,
  },
  {
    key: 'averageStayNights',
    label: 'Durée moyenne d’un séjour',
    hint: 'Détermine le nombre de ménages dans l’année.',
    min: 1,
    max: 14,
    step: 0.5,
    // Séparateur décimal français : « 3,5 nuits », jamais « 3.5 nuits ».
    format: (value) => `${value.toLocaleString('fr-FR')} nuits`,
  },
  {
    key: 'longTermMonthlyRent',
    label: 'Loyer en location classique',
    hint: 'Pour la comparaison. Vous connaissez le vôtre.',
    min: 200,
    max: 4000,
    step: 50,
    format: formatEuros,
  },
];

type AssumptionControlsProps = {
  assumptions: Assumptions;
  onChange: <K extends keyof Assumptions>(key: K, value: Assumptions[K]) => void;
  onReset: () => void;
};

export function AssumptionControls({
  assumptions,
  onChange,
  onReset,
}: AssumptionControlsProps) {
  const groupId = useId();

  return (
    <section className={styles.block} aria-labelledby={`${groupId}-title`}>
      <div className={styles.head}>
        <div>
          <p className={styles.kicker}>Vos hypothèses</p>
          <h2 id={`${groupId}-title`} className={styles.title}>
            Ce ne sont pas nos chiffres. Ce sont les vôtres.
          </h2>
        </div>
        <button type="button" className={styles.reset} onClick={onReset}>
          Revenir aux valeurs de départ
        </button>
      </div>

      <p className={styles.lead}>
        Corrigez ce qui ne correspond pas à votre marché. Tout se recalcule au-dessus, en direct.
      </p>

      <div className={styles.fields}>
        {fields.map((field) => {
          const value = assumptions[field.key];
          const id = `${groupId}-${field.key}`;

          return (
            <div key={field.key} className={styles.field}>
              <label className={styles.label} htmlFor={id}>
                {field.label}
                <output className={styles.value} htmlFor={id}>
                  {field.format(value)}
                </output>
              </label>

              <input
                id={id}
                type="range"
                className={styles.slider}
                min={field.min}
                max={field.max}
                step={field.step}
                value={value}
                onChange={(event) => onChange(field.key, Number(event.target.value))}
              />

              <p className={styles.hint}>{field.hint}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
