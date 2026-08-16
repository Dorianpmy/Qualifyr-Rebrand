import type { ReactNode } from 'react';

/**
 * Trois cartes empilées, en éventail au survol.
 *
 * **Pourquoi pas un composant shadcn.** Le projet n'a ni `components.json`, ni
 * `lib/utils.ts`/`cn()`, ni Tailwind config classique (v4, tout vit dans
 * `@theme` côté CSS) — installer la chaîne shadcn pour trois cartes ajouterait
 * une convention entière au projet pour un seul composant. La mécanique
 * (empilement en `grid-area`, dégradé de couleur au survol) est reprise
 * telle quelle ; l'habillage (bordure, icônes, couleurs, contenu) suit la
 * charte du site : icônes tracées à la main plutôt que `lucide-react` — le
 * projet n'a aucune dépendance d'icônes et n'en gagne pas une pour ça — et
 * bordure en dégradé sable/céladon plutôt que le bleu par défaut.
 *
 * **Une seule carte porte la couleur.** Comme partout ailleurs sur la page,
 * le dégradé de bordure ne s'applique qu'à un seul objet à la fois : la carte
 * du dessus, celle qu'on lit en premier. Les deux du dessous restent en
 * niveaux de gris jusqu'au survol — c'est ce qui fait la profondeur, pas une
 * troisième couleur.
 */

type StackCard = {
  readonly icon: () => ReactNode;
  readonly title: string;
  readonly description: string;
  readonly tag: string;
};

const cards: readonly StackCard[] = [
  {
    icon: () => (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21v-8.2" />
        <path d="M8.4 15.7a5.1 5.1 0 0 1 7.2 0" />
        <path d="M5.3 12.5a9.3 9.3 0 0 1 13.4 0" />
        <circle cx="12" cy="12.6" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    title: 'L’agent IA',
    description: 'Démarche votre secteur',
    tag: 'Pendant que vous travaillez',
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.3 3.5H6a2.5 2.5 0 0 0-2.5 2.5v5.3a2.5 2.5 0 0 0 .73 1.77l8.7 8.7a2.5 2.5 0 0 0 3.54 0l5.06-5.06a2.5 2.5 0 0 0 0-3.54l-8.7-8.7a2.5 2.5 0 0 0-1.5-.73Z" />
        <circle cx="8.3" cy="8.3" r="1.1" />
      </svg>
    ),
    title: 'Réservation',
    description: 'Prix et créneau en direct',
    tag: 'Acompte encaissé au clic',
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5.5h16L14 13v5.2l-4 2V13Z" />
      </svg>
    ),
    title: 'Filtrage client',
    description: 'Les curieux s’arrêtent là',
    tag: 'Vous ne voyez que le sérieux',
  },
];

/** Position dans la pile — la carte 0 est celle du dessus, en couleur. */
const stackPosition = [
  'z-30 translate-x-0 translate-y-0',
  'z-20 translate-x-10 translate-y-8 grayscale hover:grayscale-0',
  'z-10 translate-x-20 translate-y-16 grayscale hover:grayscale-0',
] as const;

function Card({ card, position, colored }: { readonly card: StackCard; readonly position: string; readonly colored: boolean }) {
  const Icon = card.icon;
  return (
    <div
      className={`[grid-area:stack] flex h-32 w-[min(84vw,21rem)] -skew-y-[6deg] select-none flex-col justify-between rounded-xl border p-4 transition-all duration-700 ease-out hover:-translate-y-3 hover:skew-y-0 ${position}`}
      style={
        colored
          ? {
              borderColor: 'transparent',
              background:
                'linear-gradient(#121213, #121213) padding-box, linear-gradient(135deg, var(--accent-1), var(--accent-3) 50%, var(--accent-2)) border-box',
            }
          : { background: '#121213', borderColor: 'rgba(255,255,255,0.08)' }
      }
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-faint [&_svg]:size-[0.95rem]"
        >
          <Icon />
        </span>
        <p className="text-[0.9375rem] font-semibold text-primary">{card.title}</p>
      </div>
      <p className="text-[0.9375rem] text-muted">{card.description}</p>
      <p className="text-[0.75rem] text-faint">{card.tag}</p>
    </div>
  );
}

export function ServiceStack() {
  return (
    <div aria-hidden="true" className="grid [grid-template-areas:'stack'] place-items-start">

      {cards.map((card, index) => (
        <Card key={card.title} card={card} position={stackPosition[index] ?? ''} colored={index === 0} />
      ))}
    </div>
  );
}
