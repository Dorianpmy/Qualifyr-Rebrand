import { formatEuros, formatPercent } from '@/lib/rental-estimate';
import type { RentalComparison as RentalComparisonData } from '@/lib/estimate/types';
import styles from './RentalComparison.module.css';

/**
 * Bloc 3 — courte durée contre location classique.
 *
 * **La diapositive qui décide.** La question réelle du propriétaire n'est pas
 * « combien ça rapporte » mais « est-ce que ça vaut mieux que mon locataire
 * actuel ». Tant qu'on ne répond pas à celle-là, aucun montant ne le fait
 * bouger.
 *
 * Deux barres à la même échelle — calculée par le moteur, sinon chaque barre
 * serait relative à elle-même et la comparaison mentirait — puis le seuil de
 * bascule, qui donne un critère de décision plutôt qu'une promesse.
 *
 * La comparaison est **volontairement défavorable au produit** : net d'un côté,
 * loyer avant charges de l'autre. C'est dit en clair sous les barres. Un
 * simulateur qui penche contre lui-même est le seul qu'on croie, et le
 * propriétaire qui repère l'inverse ne revient jamais.
 */

type RentalComparisonProps = {
  data: RentalComparisonData;
};

export function RentalComparison({ data }: RentalComparisonProps) {
  const shortTermWins = data.difference > 0;

  return (
    <section className={styles.block} aria-labelledby="comparison-title">
      <p className={styles.kicker}>Face à votre locataire actuel</p>
      <h2 id="comparison-title" className={styles.title}>
        {shortTermWins
          ? 'La courte durée rapporte davantage.'
          : 'Dans ce cas, la location classique reste devant.'}
      </h2>

      <dl className={styles.bars}>
        <div className={styles.row} data-winner={shortTermWins}>
          <dt className={styles.rowLabel}>Courte durée, net</dt>
          <dd className={styles.rowValue}>
            <span className={styles.track}>
              <span className={styles.fill} style={{ inlineSize: `${data.shortTermShare * 100}%` }} />
            </span>
            <span className={styles.amount}>{formatEuros(data.shortTermNet)}</span>
          </dd>
        </div>

        <div className={styles.row} data-winner={!shortTermWins}>
          <dt className={styles.rowLabel}>Location classique, loyer perçu</dt>
          <dd className={styles.rowValue}>
            <span className={styles.track}>
              <span className={styles.fill} style={{ inlineSize: `${data.longTermShare * 100}%` }} />
            </span>
            <span className={styles.amount}>{formatEuros(data.longTermNet)}</span>
          </dd>
        </div>
      </dl>

      <p className={styles.difference}>
        {shortTermWins ? 'Écart en faveur de la courte durée : ' : 'Écart en faveur du bail classique : '}
        <strong>{formatEuros(Math.abs(data.difference))}</strong> par an.
      </p>

      {/* Le seuil est le seul chiffre de la page qui soit un critère de
          décision et non une projection. Il bouge en direct quand on corrige
          le loyer de référence. */}
      <p className={styles.breakEven}>
        {data.breakEvenOccupancy === null ? (
          <>
            Aucun taux d’occupation réaliste ne permet ici de dépasser ce loyer. Sur ce bien,
            la location classique est le meilleur choix — et nous préférons vous le dire.
          </>
        ) : (
          <>
            Bascule à partir de{' '}
            <strong>{formatPercent(data.breakEvenOccupancy)} d’occupation</strong>. En dessous,
            votre bail actuel rapporte davantage.
          </>
        )}
      </p>

      <p className={styles.method}>
        Comparaison prudente : la courte durée est nette de toutes ses retenues, le loyer est
        affiché avant charges, vacance locative et frais de gestion. L’écart réel est donc
        plutôt supérieur à celui montré ici.
      </p>
    </section>
  );
}
