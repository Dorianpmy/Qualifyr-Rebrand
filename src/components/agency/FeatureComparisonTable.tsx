/**
 * Tableau comparatif détaillé, sous les trois cartes de tarifs.
 *
 * **Pourquoi en plus des cartes, pas à leur place.** Les cartes vendent —
 * elles répondent à « qu'est-ce que ça change pour ma semaine ». Ce tableau
 * répond à la question suivante, posée par quelqu'un déjà convaincu mais qui
 * hésite entre deux offres : « concrètement, qu'est-ce que je perds si je
 * prends l'agent seul plutôt que le pack ? ». Les deux questions ne se
 * répondent pas dans le même format ; les fusionner aurait alourdi les cartes
 * pour tout le monde afin de satisfaire une minorité d'indécis.
 *
 * **Chaque ligne est une fonctionnalité réellement construite.** Rien ici
 * n'anticipe une fonctionnalité à venir — un tableau comparatif qui promet
 * plus que le produit ne fait devient l'argument du client qui annule.
 */

type Cell = boolean | string;

type Row = {
  readonly label: string;
  readonly hint?: string;
  readonly agent: Cell;
  readonly complet: Cell;
  readonly saas: Cell;
};

const rows: readonly Row[] = [
  {
    label: 'Agent de prospection',
    hint: 'Toutes vos communes, pas seulement la vôtre',
    agent: true,
    complet: true,
    saas: false,
  },
  {
    label: 'Rapport de secteur par e-mail',
    agent: true,
    complet: true,
    saas: false,
  },
  {
    label: 'Page de réservation en ligne',
    agent: false,
    complet: true,
    saas: true,
  },
  {
    label: 'Acompte encaissé au clic',
    agent: false,
    complet: true,
    saas: true,
  },
  {
    label: 'Relance automatique des devis abandonnés',
    agent: false,
    complet: true,
    saas: true,
  },
  {
    label: 'Facturation France/Suisse',
    hint: 'TVA et mentions au bon format, dont facture électronique (XML)',
    agent: false,
    complet: true,
    saas: true,
  },
  {
    label: 'Galerie avant/après',
    agent: false,
    complet: true,
    saas: true,
  },
  {
    label: 'Rendez-vous trouvés par l’agent dans le même agenda',
    agent: false,
    complet: true,
    saas: false,
  },
  {
    label: 'Support',
    agent: 'Standard',
    complet: 'Prioritaire',
    saas: 'Standard',
  },
];

function Mark({ value }: { readonly value: Cell }) {
  if (typeof value === 'string') {
    return <span className="text-[0.8125rem] font-medium text-muted">{value}</span>;
  }
  if (!value) {
    return (
      <span aria-hidden="true" className="text-[0.9rem] text-faint">
        —
      </span>
    );
  }
  return (
    <svg
      viewBox="0 0 16 16"
      aria-label="Inclus"
      className="mx-auto size-4 fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]"
      style={{ stroke: 'var(--accent-2)' }}
    >
      <path d="M3 8.5l3.2 3.2L13 4.8" />
    </svg>
  );
}

export function FeatureComparisonTable() {
  return (
    <div className="mx-auto mt-4 max-w-[58rem] overflow-x-auto">
      <table className="w-full min-w-[38rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-hairline">
            <th className="py-3 pr-4 text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-faint">
              Fonctionnalité
            </th>
            <th className="px-3 py-3 text-center text-[0.8125rem] font-semibold text-muted">
              Agent seul
            </th>
            <th className="px-3 py-3 text-center text-[0.8125rem] font-semibold text-primary">
              Pack complet
            </th>
            <th className="px-3 py-3 text-center text-[0.8125rem] font-semibold text-muted">
              Système seul
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-hairline last:border-b-0">
              <td className="py-3.5 pr-4">
                <span className="text-[0.875rem] font-medium text-primary">{row.label}</span>
                {row.hint ? (
                  <span className="mt-0.5 block text-[0.75rem] leading-[1.4] text-faint">
                    {row.hint}
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-3.5 text-center">
                <Mark value={row.agent} />
              </td>
              <td className="px-3 py-3.5 text-center">
                <Mark value={row.complet} />
              </td>
              <td className="px-3 py-3.5 text-center">
                <Mark value={row.saas} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
