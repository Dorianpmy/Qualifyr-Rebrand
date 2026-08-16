import { orbTints, personTints } from './agent-visuals';
import { GlowCard, Orb, type Service } from './ServiceTabs';

/**
 * Contenu de la section services.
 *
 * Séparé du composant : la mise en page ne doit pas changer quand le discours
 * change, et le discours change souvent. Ajouter ou retirer un service se fait
 * ici, sans toucher à la mécanique des onglets.
 *
 * Le tableau accepte deux à quatre entrées. Retirer `visual` bascule le service
 * en pleine largeur centrée.
 */

export const services: readonly Service[] = [
  {
    id: 'agent',
    tab: 'L’agent IA',
    title: 'Il démarche votre secteur pendant que vous polissez.',
    body: 'Vous donnez un rayon et un type de clientèle. L’agent travaille en continu, répond aux premières questions, et ne vous transmet que ce qui mérite votre temps.',
    visual: (
      <div className="grid gap-3">
        <GlowCard>
          <p className="mb-1 text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
            Votre périmètre
          </p>
          <p className="text-[0.9375rem] text-muted">Detailing à domicile · 15 km · Lyon 3e</p>
        </GlowCard>

        {/* Les trois agents, nommés. « Il cherche / il trie / il retient »
            décrivait des verbes ; nommer les agents montre qu'il s'agit de
            trois entités distinctes qui travaillent en parallèle — ce qui est
            précisément l'argument de vente. */}
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { name: 'Prospection', tint: orbTints.sable },
            { name: 'Filtrage', tint: orbTints.duo },
            { name: 'Mémoire', tint: orbTints.celadon },
          ].map((agent) => (
            <div
              key={agent.name}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5"
            >
              <Orb tint={agent.tint} size="1.375rem" />
              <span className="truncate text-[0.8125rem] text-muted">{agent.name}</span>
            </div>
          ))}
        </div>

        <GlowCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.9375rem] font-semibold text-primary">Créneau réservé</p>
              <p className="text-[0.8125rem] text-faint">Berline · Complet · Mardi 14 h</p>
            </div>
            <span className="shrink-0 text-[1.25rem] font-bold tabular-nums text-primary">
              289 €
            </span>
          </div>
        </GlowCard>
      </div>
    ),
  },
  {
    id: 'reservation',
    tab: 'Réservation',
    title: 'Le prix s’affiche pendant qu’il choisit.',
    body: 'Taille du véhicule, formule, état réel : le montant et la durée se calculent à l’écran. Plus de devis rédigé le soir pour quelqu’un qui ne répondra pas.',
    visual: (
      <GlowCard className="!p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-[0.6875rem] uppercase tracking-[0.08em] text-faint">Estimation</span>
          <span className="text-[2rem] font-bold leading-none tabular-nums text-primary">289 €</span>
        </div>
        <div className="grid gap-2 border-t border-white/10 pt-4 text-[0.875rem]">
          {[
            ['Complet · SUV', '240 €'],
            ['Poils et taches', '+ 49 €'],
            ['Durée annoncée', '4 h'],
          ].map(([left, right]) => (
            <div key={left} className="flex justify-between text-muted">
              <span>{left}</span>
              <span className="tabular-nums">{right}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[0.8125rem] text-faint">Montant ferme. Acompte à la réservation.</p>
      </GlowCard>
    ),
  },
  {
    id: 'filtrage',
    tab: 'Filtrage client',
    title: 'Les curieux s’arrêtent avant votre téléphone.',
    body: 'Celui qui veut juste un prix l’obtient sans vous déranger. Celui qui va au bout a déjà accepté le montant et laissé un acompte — le créneau est tenu.',
    visual: (
      <div className="grid gap-2.5">
        {/* Les initiales rendent la liste concrète : ce sont des personnes, pas
            des lignes de base de données. Le visiteur anonyme, lui, n'a pas de
            pastille — un cercle vide dit qu'on ne sait rien de lui, ce qui est
            exactement le propos. */}
        {[
          { name: 'Demande anonyme', note: 'A vu le prix, n’a pas réservé', muted: true },
          {
            name: 'Sofia M.',
            note: 'Acompte 87 € encaissé',
            muted: false,
            initials: 'SM',
            tint: personTints.sable,
          },
          {
            name: 'Thomas L.',
            note: 'Créneau confirmé mardi 14 h',
            muted: false,
            initials: 'TL',
            tint: personTints.celadon,
          },
        ].map((row) =>
          row.muted ? (
            <div
              key={row.name}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.015] px-4 py-3"
            >
              <span
                aria-hidden="true"
                className="size-8 shrink-0 rounded-full border border-dashed border-white/15"
              />
              <div className="min-w-0">
                <p className="text-[0.9375rem] text-faint line-through decoration-white/20">
                  {row.name}
                </p>
                <p className="text-[0.8125rem] text-faint">{row.note}</p>
              </div>
            </div>
          ) : (
            <GlowCard key={row.name} className="!px-4 !py-3">
              <div className="flex items-center gap-3">
                <Orb tint={row.tint ?? personTints.sable} size="2rem" label={row.initials ?? ''} />
                <div className="min-w-0">
                  <p className="text-[0.9375rem] font-medium text-primary">{row.name}</p>
                  <p className="text-[0.8125rem] text-muted">{row.note}</p>
                </div>
              </div>
            </GlowCard>
          ),
        )}
      </div>
    ),
  },
];
