import { Section } from '@/components/agency/Section';
import { agents } from '@/content/agents';

/**
 * Les trois agents, côte à côte.
 *
 * **Le site n'expliquait nulle part qu'il y en a trois.** `AgentFlow` détaille
 * l'agent de recensement, le tunnel de réservation a sa démonstration, et le
 * filtrage n'apparaissait qu'en creux dans les listes de fonctionnalités. Un
 * visiteur pouvait lire toute la page d'accueil sans comprendre que le produit
 * est fait de trois briques qui font des métiers différents.
 *
 * **La couleur sert à distinguer, pas à décorer.** C'est la seule section du
 * site où trois teintes cohabitent, et c'est justifié : ce sont trois choses
 * différentes, et l'œil doit pouvoir les suivre ensuite ailleurs — le badge
 * d'un agent, son point d'état, la ligne de sa colonne portent la même teinte
 * partout. Ailleurs qu'ici, une couleur qui n'identifie pas un agent n'a rien
 * à faire dans la charte.
 *
 * **Trois emplois de la couleur, pas un de plus** : la ligne verticale à
 * gauche de la carte, le point d'état du badge, et la puce de chaque étape.
 * Aucun aplat, aucun dégradé, aucun texte coloré. Les titres et le corps
 * restent dans les gris de la charte — sur fond sombre, un titre coloré perd
 * en lisibilité ce qu'il gagne en présence, et trois titres de trois couleurs
 * différentes feraient exactement le « SaaS générique » que la charte exclut.
 *
 * **Les cartes ne portent pas de fond.** Un filet d'un pixel et beaucoup
 * d'espace suffisent à les séparer ; trois panneaux pleins alourdiraient une
 * page qui tient précisément par son air.
 */
export function AgentTriad() {
  return (
    <Section labelledBy="agents-title" className="border-t border-hairline py-24">
      <div className="mb-14 max-w-[42rem]">
        <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-faint">
          Le système
        </p>
        <h2
          id="agents-title"
          className="mb-4 text-[clamp(1.9rem,4vw,2.9rem)] font-bold leading-[1.1] tracking-[-0.03em] text-primary"
        >
          Trois agents, trois métiers.
        </h2>
        <p className="text-[1.0625rem] leading-[1.7] text-muted">
          Chacun prend en charge un moment précis : trouver, qualifier, convertir. Ils
          fonctionnent séparément et se complètent.
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-3">
        {agents.map((agent, index) => (
          <li
            key={agent.id}
            className="relative overflow-hidden rounded-2xl border border-hairline p-6 pl-7"
          >
            {/* La ligne verticale — le repère de couleur le plus stable d'une
                carte : elle ne bouge pas avec le texte et reste lisible même
                quand la carte est tronquée par le défilement horizontal. */}
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-[3px]"
              style={{ background: `var(${agent.token})` }}
            />

            <div className="mb-5 flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full"
                style={{ background: `var(${agent.token})` }}
              />
              <span className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-faint">
                {/* Numéroté : la charte éditoriale du site numérote ses
                    sections, et l'ordre compte ici — c'est celui dans lequel
                    une demande traverse le système. */}
                {String(index + 1).padStart(2, '0')} — {agent.shortLabel}
              </span>
            </div>

            <h3 className="mb-2.5 text-[1.125rem] font-semibold tracking-[-0.02em] text-primary">
              {agent.label}
            </h3>

            <p className="mb-6 text-[0.9375rem] leading-[1.6] text-muted">{agent.summary}</p>

            <ul className="grid gap-2.5">
              {agent.steps.map((step) => (
                <li
                  key={step}
                  className="flex items-start gap-2.5 text-[0.875rem] leading-[1.5] text-faint"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[0.45rem] size-1 shrink-0 rounded-full"
                    style={{ background: `var(${agent.token})`, opacity: 0.7 }}
                  />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  );
}
