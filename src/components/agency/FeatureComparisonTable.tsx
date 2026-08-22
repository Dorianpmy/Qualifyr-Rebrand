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

/*
 * Corrigé le 22/08/2026 (audit d'avant mise en production,
 * `docs/11-audit-pre-production.md`).
 *
 * Deux lignes ne correspondaient pas au produit : « Toutes vos communes »
 * (l'agent couvre trois codes postaux, le rayon en kilomètres étant reçu puis
 * ignoré) et « Rendez-vous trouvés par l'agent dans le même agenda » (l'agent
 * ne crée aucune réservation — il n'écrit que dans `agent_prospects`).
 *
 * Ce tableau est aussi la référence commerciale des droits par abonnement :
 * `tests/entitlements.test.ts` vérifie qu'il reste aligné sur la matrice
 * technique de `lib/billing/entitlements.ts`. Modifier une ligne ici sans
 * modifier la matrice fait échouer les tests, volontairement.
 */
const rows: readonly Row[] = [
  {
    label: 'Agent de recensement',
    hint: 'Les codes postaux voisins de votre zone',
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
    label: 'Agent et réservations sur le même compte',
    hint: 'Deux produits, un seul abonnement — les données restent séparées',
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

const plans = [
  { key: 'agent', label: 'Agent seul', featured: false },
  { key: 'complet', label: 'Pack complet', featured: true },
  { key: 'saas', label: 'Système seul', featured: false },
] as const;

function Mark({ value, tone }: { readonly value: Cell; readonly tone: 'dark' | 'light' }) {
  if (typeof value === 'string') {
    return (
      <span
        className="text-[0.8125rem] font-medium"
        style={{ color: tone === 'light' ? '#6b6155' : undefined }}
      >
        {value}
      </span>
    );
  }
  if (!value) {
    return (
      <span aria-hidden="true" className="text-[0.9rem]" style={{ color: tone === 'light' ? '#c9c2b6' : undefined }}>
        —
      </span>
    );
  }
  return (
    <svg
      viewBox="0 0 16 16"
      aria-label="Inclus"
      className="mx-auto size-4 fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]"
      style={{ stroke: tone === 'light' ? '#1f6f5c' : 'var(--accent-2)' }}
    >
      <path d="M3 8.5l3.2 3.2L13 4.8" />
    </svg>
  );
}

/**
 * Version mobile : une carte par offre plutôt qu'un tableau qu'il faut faire
 * défiler horizontalement. Sur un écran de téléphone, `overflow-x-auto` sur
 * un tableau à quatre colonnes fait deviner à l'utilisateur qu'il manque du
 * contenu au bord de l'écran plutôt que de le lui montrer — la maquette de
 * référence envoyée resegmente la même donnée en cartes empilées à cette
 * largeur, repris ici.
 *
 * **Fond clair, pas sombre.** Toute la page est sombre depuis le hero
 * jusqu'au pied de page ; une carte qui reste sombre elle aussi se noie dans
 * le fond. Le clair (tons sable de la charte, pas un blanc pur) fait
 * respirer cette section précise sans rompre la continuité de couleur du
 * reste de la page — le même rôle que joue `.node-hero` plus haut, avec un
 * contraste inversé.
 */
function MobilePlanCard({ plan }: { readonly plan: (typeof plans)[number] }) {
  return (
    <div
      style={{
        background: '#f7f4ee',
        borderRadius: '1.25rem',
        padding: '1.25rem 1.25rem 1.5rem',
        border: plan.featured ? '1px solid #d8cdb4' : '1px solid transparent',
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.9375rem] font-bold" style={{ color: '#1a1712' }}>
          {plan.label}
        </p>
        {plan.featured ? (
          <span
            className="rounded-full px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.08em]"
            style={{ backgroundColor: '#1a1712', color: '#f7f4ee' }}
          >
            Le plus pris
          </span>
        ) : null}
      </div>
      <ul className="grid gap-2.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start justify-between gap-3">
            <span className="text-[0.8125rem] leading-[1.4]" style={{ color: '#3a3428' }}>
              {row.label}
            </span>
            <span style={{ flexShrink: 0, paddingTop: '0.05rem' }}>
              <Mark value={row[plan.key]} tone="light" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FeatureComparisonTable() {
  return (
    <div className="mx-auto mt-4 max-w-[58rem]">
      {/* Cartes empilées sous 1024 px. */}
      <div className="grid gap-3 lg:hidden">
        {plans.map((plan) => (
          <MobilePlanCard key={plan.key} plan={plan} />
        ))}
      </div>

      {/* Tableau au-delà : quatre colonnes qui tiennent sans défilement. */}
      <div className="hidden overflow-x-auto lg:block">
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
                  <Mark value={row.agent} tone="light" />
                </td>
                <td className="px-3 py-3.5 text-center">
                  <Mark value={row.complet} tone="light" />
                </td>
                <td className="px-3 py-3.5 text-center">
                  <Mark value={row.saas} tone="light" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
