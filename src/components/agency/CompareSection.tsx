import { Section } from './Section';

/**
 * Tableau comparatif — Qualifyr face aux alternatives réelles.
 *
 * **Pourquoi ce bloc manquait.** La page expliquait ce que fait le produit,
 * jamais ce qu'il fait *de plus*. Or le detailer ne part pas de zéro : il a
 * déjà Instagram, un carnet, un logiciel de rendez-vous généraliste. Tant
 * qu'on ne nomme pas ces solutions, il compare le prix de Qualifyr à zéro —
 * et zéro gagne toujours.
 *
 * **Les colonnes sont des catégories, pas des marques.** Nommer un concurrent
 * lui fait de la publicité auprès de gens qui ne le connaissaient pas, et
 * expose à devoir défendre chaque case si sa fiche change demain. « Un
 * logiciel de rendez-vous » se vérifie sans procès.
 *
 * **Aucune colonne n'est vide sur toute sa hauteur.** Un tableau où le
 * concurrent perd partout n'est pas lu comme une comparaison mais comme une
 * publicité — et le lecteur cherche alors ce qu'on lui cache. Instagram gagne
 * sur la découverte, le logiciel généraliste sur le prix : c'est vrai, et le
 * reconnaître rend crédibles les lignes où l'on gagne.
 */

type Support = 'yes' | 'no' | 'partial';

type Row = {
  readonly label: string;
  readonly qualifyr: Support;
  readonly social: Support;
  readonly generic: Support;
};

const rows: readonly Row[] = [
  {
    label: 'Vous fait découvrir par de nouveaux clients',
    qualifyr: 'yes',
    social: 'yes',
    generic: 'no',
  },
  {
    label: 'Affiche un prix ferme selon le véhicule et son état',
    qualifyr: 'yes',
    social: 'no',
    generic: 'partial',
  },
  {
    label: 'Encaisse un acompte au moment de la réservation',
    qualifyr: 'yes',
    social: 'no',
    generic: 'partial',
  },
  {
    label: 'Calcule la distance et le coût du déplacement',
    qualifyr: 'yes',
    social: 'no',
    generic: 'no',
  },
  {
    label: 'Connaît le métier : formules, état réel, accès eau et courant',
    qualifyr: 'yes',
    social: 'no',
    generic: 'no',
  },
  {
    label: 'Va chercher des clients pendant que vous travaillez',
    qualifyr: 'yes',
    social: 'no',
    generic: 'no',
  },
  {
    label: 'Facture aux normes françaises et suisses',
    qualifyr: 'yes',
    social: 'no',
    generic: 'partial',
  },
  {
    label: 'Ne coûte rien',
    qualifyr: 'no',
    social: 'yes',
    generic: 'no',
  },
];

function Mark({ value, strong }: { readonly value: Support; readonly strong: boolean }) {
  if (value === 'yes') {
    return (
      <svg
        viewBox="0 0 16 16"
        role="img"
        aria-label="Oui"
        className="mx-auto size-[1.15rem] fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]"
        style={{ stroke: strong ? 'var(--accent-2)' : 'rgba(255,255,255,0.32)' }}
      >
        <path d="M3 8.5l3.2 3.2L13 4.8" />
      </svg>
    );
  }

  if (value === 'partial') {
    /* Un tiret et non une demi-coche : « partiellement » se comprend mieux en
       lisant la légende qu'en devinant un symbole intermédiaire. */
    return (
      <span role="img" aria-label="Partiellement" className="mx-auto block text-faint">
        —
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 16 16"
      role="img"
      aria-label="Non"
      className="mx-auto size-[0.95rem] fill-none stroke-white/15 [stroke-linecap:round] [stroke-width:2]"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export function CompareSection() {
  return (
    <Section labelledBy="compare-title" className="border-t border-hairline py-24">
      <header className="mx-auto mb-12 max-w-[46rem] text-center">
        <p className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-faint">
          La différence
        </p>
        <h2
          id="compare-title"
          className="mb-5 text-[clamp(1.75rem,3.6vw,2.6rem)] font-bold leading-[1.16] tracking-[-0.025em] text-primary"
        >
          Vous avez déjà des solutions. Voilà ce qu’elles ne font pas.
        </h2>
        <p className="mx-auto max-w-[36rem] text-[1.0625rem] leading-[1.65] text-muted">
          Instagram vous fait connaître et un logiciel de rendez-vous bloque des créneaux. Aucun des
          deux ne sait ce que coûte un intérieur de SUV plein de poils de chien.
        </p>
      </header>

      {/* `overflow-x-auto` : sur un téléphone, quatre colonnes ne tiennent pas.
          Le tableau défile latéralement plutôt que de comprimer les libellés
          en colonnes de deux caractères. */}
      <div className="mx-auto max-w-[58rem] overflow-x-auto">
        <table className="w-full min-w-[38rem] border-collapse text-start">
          <thead>
            <tr>
              <th className="w-[42%] pb-4 text-start text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-faint">
                <span className="sr-only">Fonctionnalité</span>
              </th>
              {/* La colonne Qualifyr porte le seul contour dégradé du tableau —
                  elle doit se lire comme la réponse, pas comme une option. */}
              <th
                scope="col"
                className="rounded-t-xl border border-b-0 border-transparent px-3 py-3 text-[0.875rem] font-bold text-primary"
                style={{
                  background:
                    'linear-gradient(#121213, #121213) padding-box, linear-gradient(140deg, var(--accent-1), transparent 60%, var(--accent-2)) border-box',
                }}
              >
                Qualifyr
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-[0.875rem] font-semibold text-muted"
              >
                Instagram et messages
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-[0.875rem] font-semibold text-muted"
              >
                Logiciel de rendez-vous
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={row.label} className="border-t border-hairline">
                <th
                  scope="row"
                  className="py-3.5 pr-4 text-start text-[0.875rem] font-normal leading-[1.45] text-muted"
                >
                  {row.label}
                </th>
                <td
                  className={`border-x border-transparent px-3 py-3.5 text-center ${
                    index === rows.length - 1 ? 'rounded-b-xl border-b' : ''
                  }`}
                  style={{
                    background:
                      'linear-gradient(#121213, #121213) padding-box, linear-gradient(140deg, var(--accent-1), transparent 60%, var(--accent-2)) border-box',
                  }}
                >
                  <Mark value={row.qualifyr} strong />
                </td>
                <td className="px-3 py-3.5 text-center">
                  <Mark value={row.social} strong={false} />
                </td>
                <td className="px-3 py-3.5 text-center">
                  <Mark value={row.generic} strong={false} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mx-auto mt-8 max-w-[40rem] text-center text-[0.8125rem] leading-[1.6] text-faint">
        « — » signale une fonction partielle : présente, mais sans connaître les formules ni les
        véhicules. La dernière ligne est là parce qu’elle est vraie — Instagram ne vous coûte rien,
        et c’est son seul avantage décisif.
      </p>
    </Section>
  );
}
