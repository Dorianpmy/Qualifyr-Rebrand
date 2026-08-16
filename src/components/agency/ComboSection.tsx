import { Section } from './Section';

/**
 * Le combo — ce que fait le SaaS, ce que fait l'agent, et pourquoi les deux.
 *
 * **Le problème que cette section résout.** Vendre deux produits sur une même
 * page revient presque toujours à en vendre zéro : le visiteur ne sait pas
 * lequel le concerne et repart. Le découpage ci-dessous ne présente donc pas
 * deux offres côte à côte mais **deux moitiés d'un même problème** — un
 * agenda vide n'a pas la même cause qu'un agenda mal rempli, et il faut les
 * deux outils pour que le mois soit bon.
 *
 * La colonne de gauche est plus large : c'est le SaaS, le produit qu'on achète
 * en premier. L'agent vient après, une fois qu'on a de quoi encaisser.
 */

type Pillar = {
  readonly id: string;
  readonly tag: string;
  readonly title: string;
  readonly body: string;
  readonly points: readonly string[];
};

const pillars: readonly Pillar[] = [
  {
    id: 'saas',
    tag: 'Le socle',
    title: 'Vos clients réservent seuls, au bon prix.',
    body: 'Le client décrit son véhicule, voit son prix et sa durée, choisit son créneau et le bloque. Vous ne décrochez plus le téléphone entre deux polissages.',
    points: [
      'Prix ferme affiché pendant qu’il choisit, pas un devis sous 48 h',
      'Acompte encaissé à la réservation — c’est ce qui fait disparaître les lapins',
      'Adresse exacte et distance calculée, plus de trajet facturé au hasard',
      'France et Suisse : euro ou franc, TVA et code postal au bon format',
    ],
  },
  {
    id: 'agent',
    tag: 'Le moteur',
    title: 'Les clients suivants arrivent seuls.',
    body: 'Un agenda qui se remplit suppose qu’on vous connaisse. Un agent travaille votre zone pendant que vous êtes sur le terrain.',
    points: [
      'Cible les entreprises qui entretiennent vraiment : loueurs, VTC, concessions, flottes',
      'Répond, filtre, et ne vous passe que ceux qui acceptent votre tarif',
      'Les rendez-vous qu’il obtient arrivent directement dans votre agenda',
    ],
  },
];

function CheckMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      className="mt-1.5 size-3.5 shrink-0 fill-none stroke-white/45 [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8]"
    >
      <path d="M3 8.5l3.2 3.2L13 4.8" />
    </svg>
  );
}

export function ComboSection() {
  return (
    <Section labelledBy="combo-title" className="py-24">
        <header className="mx-auto mb-12 max-w-[46rem] text-center">
          <p className="mb-2 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-faint">
            Deux problèmes, deux outils
          </p>
          <h2 id="combo-title" className="mb-4 text-section">
            Un agenda vide et un agenda mal rempli ne se soignent pas pareil.
          </h2>
          <p className="text-xl leading-[1.6] text-muted">
            Le premier vient d’un manque de clients. Le second, de clients qui annulent, négocient
            ou ne viennent pas. Qualifyr traite les deux — c’est ce qui sépare un bon mois d’un
            mois correct.
          </p>
        </header>

        {/* Colonnes inégales : le SaaS domine, l'agent est décalé plus bas.
            Deux colonnes strictement égales se liraient comme un comparatif —
            l'œil chercherait laquelle choisir, alors qu'elles vont ensemble. */}
        <div className="grid items-start gap-6 lg:grid-cols-[1.25fr_1fr] [&>*:nth-child(2)]:lg:mt-14">
          {pillars.map((pillar) => (
            <article
              key={pillar.id}
              className="surface-card p-6 transition-colors duration-200 hover:border-hairline-strong hover:bg-panel-raised motion-reduce:transition-none sm:p-8"
            >
              <p className="mb-4 inline-flex surface-pill px-3 py-1 text-[0.75rem] font-medium uppercase tracking-[0.06em] text-faint">
                {pillar.tag}
              </p>

              <h3 className="mb-3 max-w-[20ch] text-card font-bold">{pillar.title}</h3>
              <p className="mb-6 max-w-[46ch] text-[1.0625rem] leading-[1.6] text-muted">
                {pillar.body}
              </p>

              <ul className="grid gap-3 border-t border-hairline pt-6">
                {pillar.points.map((point) => (
                  <li key={point} className="flex gap-3 text-[0.9375rem] leading-[1.55] text-muted">
                    <CheckMark />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
    </Section>
  );
}
