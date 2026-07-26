import { heroMoments } from '@/content/home';
import styles from './HeroComposition.module.css';

const requestFields = [
  'Véhicule',
  'Prestation',
  'Adresse d’intervention',
  'Zone couverte',
  'Créneau souhaité',
] as const;

const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;

/**
 * Composition éditoriale du hero.
 *
 * Elle donne à voir les moments que le parcours relie — découverte locale,
 * formule, véhicule, adresse, réservation, confirmation, avis — sous la forme
 * d'une planche de direction artistique.
 *
 * **Ce n'est pas une interface.** Aucune donnée n'est simulée : la fiche montre
 * la *structure* d'une demande, champs volontairement vides, et la bande de
 * semaine n'affiche que les initiales des jours. Aucun prix, aucune date,
 * aucun rendez-vous, aucun nom de client. Interdiction stricte d'y ajouter des
 * valeurs d'exemple qui pourraient passer pour réelles (AGENTS.md, §6).
 *
 * La fiche est `aria-hidden` : purement illustrative, elle serait bruyante à
 * l'oral. La séquence des moments, elle, est du vrai texte lisible.
 */
export function HeroComposition() {
  return (
    <figure className={styles.composition}>
      <div className={styles.panel}>
        <span className={styles.sheen} aria-hidden="true" />
        <span className={styles.sheenSecond} aria-hidden="true" />
        <p className={styles.panelLabel}>Le parcours</p>
        <ol className={styles.moments}>
          {heroMoments.map((moment) => (
            <li key={moment.number} className={styles.moment}>
              <span className={styles.momentNumber}>{moment.number}</span>
              <span className={styles.momentLabel}>{moment.label}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.card} aria-hidden="true">
        <p className={styles.cardLabel}>Structure d’une demande</p>
        <div className={styles.fields}>
          {requestFields.map((field) => (
            <div key={field} className={styles.field}>
              <span className={styles.fieldLabel}>{field}</span>
              <span className={styles.fieldRule} />
            </div>
          ))}
        </div>
        <div className={styles.week}>
          {days.map((day, index) => (
            <span key={`${day}-${index}`} className={styles.day}>
              <span
                className={
                  index === 3 ? `${styles.dayBar} ${styles.dayBarActive}` : styles.dayBar
                }
              />
              {day}
            </span>
          ))}
        </div>
      </div>

      <figcaption className={styles.caption}>
        Les moments que le parcours relie, de la découverte locale jusqu’à l’avis.
      </figcaption>
    </figure>
  );
}
