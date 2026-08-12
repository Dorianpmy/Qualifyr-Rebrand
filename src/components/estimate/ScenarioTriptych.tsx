import { formatEuros, formatPercent } from '@/lib/rental-estimate';
import type { Scenario } from '@/lib/estimate/types';
import styles from './ScenarioTriptych.module.css';

/**
 * Bloc 1 — trois scénarios, jamais un chiffre.
 *
 * Un montant unique est toujours faux : il promet une précision que personne
 * ne peut tenir, et il se retourne au premier relevé. Trois scénarios disent
 * la vérité — l'incertitude existe — tout en donnant sa place commerciale au
 * troisième : « optimisé » est le résultat avec un professionnel aux
 * commandes, c'est-à-dire ce que vend la conciergerie.
 *
 * Le scénario réaliste est mis en avant parce que c'est lui qui alimente tout
 * le reste de la page : la cascade, la comparaison, la saisonnalité. Afficher
 * une fourchette en tête puis un net calculé sur une autre base était la
 * contradiction que ce bloc supprime.
 *
 * Composant purement présentationnel : aucun calcul.
 */

type ScenarioTriptychProps = {
  scenarios: readonly Scenario[];
  referenceId: Scenario['id'];
};

export function ScenarioTriptych({ scenarios, referenceId }: ScenarioTriptychProps) {
  return (
    <section className={styles.block} aria-labelledby="scenarios-title">
      <p className={styles.kicker}>Revenu annuel brut estimé</p>
      <h2 id="scenarios-title" className={styles.title}>
        Trois hypothèses, pas une promesse.
      </h2>

      <ol className={styles.grid}>
        {scenarios.map((scenario) => (
          <li
            key={scenario.id}
            className={styles.scenario}
            data-reference={scenario.id === referenceId}
          >
            <p className={styles.label}>
              {scenario.label}
              {scenario.id === referenceId ? (
                <span className={styles.badge}>Référence</span>
              ) : null}
            </p>
            <p className={styles.amount}>{formatEuros(scenario.gross)}</p>
            <p className={styles.detail}>
              {scenario.nightsPerYear} nuits · {formatPercent(scenario.occupancy)} ·{' '}
              {scenario.nightlyRate} € la nuit
            </p>
            <p className={styles.rationale}>{scenario.rationale}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
