'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  amenities,
  capacities,
  cityBenchmarks,
  defaultCommissionRate,
  formatPercent,
  propertyTypes,
  standings,
  type AmenityId,
  type Capacity,
  type CityId,
  type PropertyType,
  type Standing,
} from '@/lib/rental-estimate';
import { EstimateResult } from '@/components/estimate/EstimateResult';
import styles from './RentalEstimator.module.css';

/**
 * Simulateur de revenus, en démonstration publique.
 *
 * Les choix courts sont présentés en sélecteurs segmentés plutôt qu'en listes
 * déroulantes : une liste cache ses options et demande deux gestes, un
 * sélecteur montre l'éventail et n'en demande qu'un. Seule la ville, trop
 * longue, reste une liste.
 */
export function RentalEstimator() {
  const [city, setCity] = useState<CityId>('lyon');
  const [propertyType, setPropertyType] = useState<PropertyType>('t2');
  const [capacity, setCapacity] = useState<Capacity>(4);
  const [standing, setStanding] = useState<Standing>('confort');
  const [selected, setSelected] = useState<readonly AmenityId[]>([]);

  /**
   * Entrée du moteur étendu, qui produit la cascade du net.
   *
   * Le formulaire reste ici — il fonctionne — et le résultat détaillé est
   * délégué à `EstimateResult`, seul détenteur de l'état des hypothèses. Le
   * mur est désactivé : cette page cherche à convaincre une conciergerie
   * d'acheter l'outil, pas à capter les coordonnées d'un propriétaire.
   */
  const estimateInput = useMemo(
    () => ({ city, propertyType, capacity, standing, amenities: selected }),
    [city, propertyType, capacity, standing, selected],
  );

  function toggle(id: AmenityId) {
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  return (
    <div className={styles.estimator}>
      <form className={styles.controls} onSubmit={(event) => event.preventDefault()}>
        <label className={styles.field}>
          <span>Ville</span>
          <select value={city} onChange={(event) => setCity(event.target.value as CityId)}>
            {cityBenchmarks.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className={styles.group}>
          <legend>Type de logement</legend>
          <div className={styles.segments}>
            {propertyTypes.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={styles.segment}
                data-active={propertyType === entry.id ? 'true' : undefined}
                aria-pressed={propertyType === entry.id}
                onClick={() => setPropertyType(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Capacité d’accueil</legend>
          <div className={styles.segments}>
            {capacities.map((entry) => (
              <button
                key={entry}
                type="button"
                className={styles.segment}
                data-active={capacity === entry ? 'true' : undefined}
                aria-pressed={capacity === entry}
                onClick={() => setCapacity(entry)}
              >
                {entry} <span className={styles.segmentUnit}>voy.</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Niveau de finition</legend>
          <div className={styles.segments}>
            {standings.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={styles.segment}
                data-active={standing === entry.id ? 'true' : undefined}
                aria-pressed={standing === entry.id}
                onClick={() => setStanding(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Ce qui fait la différence</legend>
          <div className={styles.chips}>
            {amenities.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={styles.chip}
                data-active={selected.includes(entry.id) ? 'true' : undefined}
                aria-pressed={selected.includes(entry.id)}
                onClick={() => toggle(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </fieldset>
      </form>

      {/* Le résumé de l'ancien moteur a été retiré le 12/08/2026.
          Il affichait une fourchette calculée sur un tarif non arrondi, tandis
          que la cascade travaillait sur le tarif arrondi : deux montants
          différents pour le même bien, dans le même panneau. Un propriétaire
          attentif l'aurait vu, et c'est exactement la crédibilité que cette
          page cherche à construire. Un seul moteur, désormais. */}
      <output className={styles.result}>
        <EstimateResult input={estimateInput} gated={false} />

        <p className={styles.disclaimer}>
          Estimation indicative, calculée à partir de moyennes de marché pour une commission de
          conciergerie de {formatPercent(defaultCommissionRate)}. Elle ne tient compte ni des
          charges, ni de la fiscalité, ni des règles locales de location courte durée, et ne
          constitue pas un engagement.
        </p>

        {/* Cette page est une démonstration publique : le visiteur qui la
            trouve est le plus souvent une conciergerie qui évalue l'outil. */}
        <Link className={styles.cta} href="/outil-conciergerie">
          Proposer ce simulateur à vos propriétaires
        </Link>
      </output>
    </div>
  );
}
