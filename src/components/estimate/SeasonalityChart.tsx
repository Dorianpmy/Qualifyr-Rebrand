import { formatEuros, formatPercent } from '@/lib/rental-estimate';
import type { Seasonality } from '@/lib/estimate/types';
import styles from './SeasonalityChart.module.css';

/**
 * Bloc 4 — la saisonnalité, mois par mois.
 *
 * **Le graphique argumente les creux, pas les pics.** Tout le monde loue en
 * août, et le propriétaire le sait : mettre le pic en avant ne prouve rien.
 * Ce qui se vend, c'est le mois de novembre rempli — et c'est exactement ce
 * qu'une conciergerie professionnelle apporte. Les mois bas sont donc en
 * cuivre, les pics en gris.
 *
 * Douze barres en CSS plutôt qu'un graphique : aucune bibliothèque, aucun
 * SVG, et la structure reste une liste de définitions qu'un lecteur d'écran
 * restitue mois par mois. Les hauteurs viennent du moteur — le composant ne
 * calcule rien, pas même une proportion.
 */

type SeasonalityChartProps = {
  data: Seasonality;
};

export function SeasonalityChart({ data }: SeasonalityChartProps) {
  const flat = data.peak.gross === data.low.gross;

  return (
    <section className={styles.block} aria-labelledby="seasonality-title">
      <p className={styles.kicker}>Répartition sur l’année</p>
      <h2 id="seasonality-title" className={styles.title}>
        {flat
          ? 'Une demande stable toute l’année.'
          : 'Votre année ne se joue pas en août.'}
      </h2>

      <dl className={styles.chart}>
        {data.months.map((month) => (
          <div key={month.month} className={styles.month} data-intensity={month.intensity}>
            <dd className={styles.bar}>
              <span className={styles.fill} style={{ blockSize: `${month.height * 100}%` }} />
              <span className={styles.tooltip}>{formatEuros(month.gross)}</span>
            </dd>
            <dt className={styles.label}>{month.label}</dt>
          </div>
        ))}
      </dl>

      <div className={styles.legend}>
        <span data-intensity="low">Basse saison</span>
        <span data-intensity="mid">Moyenne</span>
        <span data-intensity="high">Haute saison</span>
      </div>

      <p className={styles.reading}>
        {flat ? (
          <>
            La demande varie peu d’un mois à l’autre : le revenu dépend ici surtout du taux de
            remplissage, donc de la régularité de la gestion.
          </>
        ) : (
          <>
            Trois mois concentrent{' '}
            <strong>{formatPercent(data.topThreeShare)}</strong> du revenu annuel. Le reste se
            gagne sur les mois creux — et c’est précisément là qu’une gestion professionnelle
            change le résultat.
          </>
        )}
      </p>

      {data.lowSeasonGross > 0 ? (
        <p className={styles.stake}>
          Les mois de basse saison représentent tout de même{' '}
          <strong>{formatEuros(data.lowSeasonGross)}</strong> par an. C’est ce qui disparaît
          quand un calendrier n’est pas tenu.
        </p>
      ) : null}
    </section>
  );
}
