import { formatEuros, formatPercent } from '@/lib/rental-estimate';
import type { NetBreakdown as NetBreakdownData } from '@/lib/estimate/types';
import styles from './NetBreakdown.module.css';

/**
 * Bloc 2 — la cascade du net réel.
 *
 * **Composant purement présentationnel : il ne calcule rien.** Les montants et
 * les parts arrivent déjà construits par le moteur, y compris les proportions
 * de la barre. Une règle de trois ici suffirait à faire diverger la page et le
 * document PDF (`docs/12`, §4).
 *
 * Le parti pris d'affichage : le brut et le net sont **confrontés en haut**,
 * avant tout détail. C'est le seul moment de la page où le propriétaire
 * comprend, sans lire, que le chiffre qu'on lui promet ailleurs n'est pas
 * celui qu'il touchera. La barre proportionnelle donne l'ordre de grandeur en
 * un coup d'œil ; la liste répond ensuite à « pourquoi ».
 *
 * La part conservée est donnée en clair. Elle est souvent basse, et c'est
 * précisément l'intérêt : un simulateur qui l'affiche est un simulateur qui ne
 * cherche pas à avoir son lecteur.
 */

type NetBreakdownProps = {
  data: NetBreakdownData;
};

export function NetBreakdown({ data }: NetBreakdownProps) {
  const gross = data.lines.find((line) => line.id === 'gross');
  const deductions = data.lines.filter((line) => line.kind === 'deduction');

  return (
    <section className={styles.block} aria-labelledby="net-title">
      <p className={styles.kicker}>Ce qui reste vraiment</p>
      <h2 id="net-title" className={styles.title}>
        Le brut n’est pas ce que vous touchez.
      </h2>

      <div className={styles.confrontation}>
        <div className={styles.side}>
          <p className={styles.sideLabel}>Revenus bruts</p>
          <p className={styles.grossAmount}>{gross ? formatEuros(gross.amount) : '—'}</p>
          <p className={styles.sideNote}>C’est le chiffre que l’on vous annonce ailleurs.</p>
        </div>

        <p className={styles.operator} aria-hidden="true">
          →
        </p>

        <div className={styles.side}>
          <p className={styles.sideLabel}>Net estimé, dans votre poche</p>
          <p className={styles.netAmount}>{formatEuros(data.net)}</p>
          <p className={styles.sideNote}>
            Soit {formatPercent(data.netShare)} du brut, après toutes les retenues.
          </p>
        </div>
      </div>

      {/* Barre proportionnelle : le net d'abord, à gauche, pour qu'il domine la
          lecture. Les retenues suivent dans l'ordre de la liste. Purement
          décorative pour les lecteurs d'écran — la liste ci-dessous porte
          l'information, et la dupliquer allongerait la restitution vocale. */}
      <div className={styles.bar} aria-hidden="true">
        <span
          className={`${styles.segment} ${styles.segmentNet}`}
          style={{ flexGrow: data.netShare }}
        />
        {deductions.map((line) => (
          <span
            key={line.id}
            className={styles.segment}
            data-line={line.id}
            style={{ flexGrow: line.share }}
          />
        ))}
      </div>

      <ol className={styles.lines}>
        {data.lines.map((line) => (
          <li key={line.id} className={styles.line} data-kind={line.kind}>
            <span className={styles.lineLabel}>
              {line.label}
              <span className={styles.lineDetail}>{line.detail}</span>
            </span>
            <span className={styles.lineAmount}>
              {line.kind === 'deduction' ? '−' : ''}
              {formatEuros(line.amount)}
            </span>
          </li>
        ))}

        <li className={styles.line} data-kind="net">
          <span className={styles.lineLabel}>
            Net propriétaire
            <span className={styles.lineDetail}>Avant charges de copropriété et fiscalité</span>
          </span>
          <span className={styles.lineAmount}>{formatEuros(data.net)}</span>
        </li>
      </ol>
    </section>
  );
}
