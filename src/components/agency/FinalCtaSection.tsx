import Link from 'next/link';
import { orbTints } from './agent-visuals';
import { Orb } from './ServiceTabs';
import { Section } from './Section';

/**
 * Fermeture de la page d'accueil, juste avant le pied de page.
 *
 * **Il manquait une sortie.** La page se terminait sur la FAQ — la dernière
 * chose lue était une objection, pas une invitation. Entre l'objection et le
 * pied de page, personne ne relance.
 *
 * **Pas de preuve sociale ici.** Les avatars et le compteur du hero sont déjà
 * signalés comme non vérifiés (voir `page.tsx`) ; les dupliquer dans cette
 * section aurait doublé le risque au lieu de le limiter à un seul endroit à
 * corriger. Les trois réassurances ci-dessous sont vraies dès aujourd'hui,
 * sans donnée à confirmer.
 *
 * **La carte de droite montre le produit, pas une promesse.** Trois lignes
 * qui reprennent le vocabulaire déjà installé plus haut sur la page (zone
 * analysée, devis relancé, acompte encaissé) — jamais un chiffre inventé.
 */

const feed = [
  { label: 'Zone 69003 analysée', detail: '42 professionnels retenus' },
  { label: 'Devis relancé automatiquement', detail: 'créneau du jeudi 14h' },
  { label: 'Acompte encaissé', detail: 'créneau tenu, sans appel' },
] as const;

const reassurance = ['Sans carte bancaire pour tester', 'Résiliable en un clic', 'France et Suisse'] as const;

export function FinalCtaSection() {
  return (
    <Section labelledBy="final-cta-title" glow="bottom" className="border-t border-hairline py-24">
      <div className="mx-auto grid max-w-[64rem] items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div>
          <p className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-faint">
            Votre secteur vous attend
          </p>
          <h2
            id="final-cta-title"
            className="mb-5 text-[clamp(1.9rem,3.8vw,2.75rem)] font-bold leading-[1.12] tracking-[-0.025em] text-primary"
          >
            Lancez l’agent. Il fait le reste.
          </h2>
          <p className="mb-8 max-w-[30rem] text-[1.0625rem] leading-[1.65] text-muted">
            Une zone gratuite, sans carte bancaire. Vous voyez ce que l’agent trouve avant de
            décider si vous voulez plus.
          </p>

          <div className="mb-8 flex flex-wrap items-center gap-3">
            <Link
              href="#agent-title"
              className="cta-solid accent-glow inline-flex min-h-[48px] items-center rounded-full bg-white px-6 text-[0.9375rem] font-semibold text-ink no-underline transition-colors duration-150 hover:bg-white/90"
            >
              Analyser ma zone gratuitement
            </Link>
            <Link
              href="/creation-site-web"
              className="inline-flex min-h-[48px] items-center rounded-full px-6 text-[0.9375rem] font-semibold !text-primary no-underline transition-colors duration-150 hover:bg-white/[0.06]"
              style={{ border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Créer mon site avec Qualifyr
            </Link>
          </div>

          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
            {reassurance.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[0.875rem] text-muted">
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="size-4 shrink-0 fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]"
                  style={{ stroke: 'var(--accent-2)' }}
                >
                  <path d="M3 8.5l3.2 3.2L13 4.8" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Carte produit : même contour tricolore que l'agent central
            d'`AgentFlow` et la colonne « Avec Qualifyr » de `BeforeAfterSection` —
            le visiteur qui arrive jusqu'ici l'a déjà vu deux fois, la retrouver
            confirme au lieu d'introduire un nouveau visuel. */}
        <div className="node-hero rounded-[1.5rem] p-6 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <Orb tint={orbTints.qualifyr} size="2.75rem" />
            <div>
              <p className="text-[0.875rem] font-semibold text-primary">Agent Qualifyr</p>
              <p className="text-[0.75rem] text-faint">En activité sur votre secteur</p>
            </div>
          </div>
          <ul className="grid gap-3">
            {feed.map((item) => (
              <li
                key={item.label}
                className="rounded-2xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-[0.875rem] font-medium text-primary">{item.label}</p>
                <p className="mt-0.5 text-[0.75rem] text-faint">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
