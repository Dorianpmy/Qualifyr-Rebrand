import type { ReactNode } from 'react';
import { Section } from './Section';
import { orbTints } from './agent-visuals';
import { Orb } from './ServiceTabs';

/**
 * Grille de fonctionnalités de l'agent — et son mur payant.
 *
 * **Ce que ce bloc doit faire.** Le visiteur vient d'analyser une zone
 * gratuitement, plus haut dans la page. Il a maintenant un résultat entre les
 * mains et une question évidente : « et pour les autres communes ? ». Cette
 * grille répond à cette question précise, et son prix.
 *
 * **La gratuité porte sur une zone, pas sur une durée.** Un essai de 14 jours
 * se termine par une date, ce qui pousse à s'inscrire puis à oublier. Une zone
 * gratuite se termine par un manque : le professionnel a vu ce que l'agent
 * trouve chez lui, il veut la commune d'à côté. Le manque convertit mieux que
 * le compte à rebours parce qu'il est né d'un résultat réel.
 *
 * **Aucune carte n'affiche de chiffre inventé.** Écrire « 47 prospects
 * trouvés » serait un chiffre faux montré à quelqu'un qui va le vérifier sur
 * son propre terrain dans les minutes qui suivent. Les maquettes montrent la
 * forme de l'interface — segments, états, verrous — jamais un volume. Le seul
 * nombre de ce bloc est le prix, et lui est vrai.
 */

/** Prix d'entrée. Une seule déclaration : le chiffre apparaît à trois endroits. */
const MONTHLY_PRICE = '17 €';

/**
 * Cellule de la grille.
 *
 * La maquette occupe le haut dans un cadre imbriqué, le texte vient en
 * dessous. Cet emboîtement — un panneau dans un panneau — est ce qui donne la
 * profondeur : une maquette posée à même la carte, sans son propre cadre,
 * ressemble à une illustration décorative plutôt qu'à une capture du produit.
 */
function Cell({
  title,
  body,
  children,
  className = '',
}: {
  readonly title: string;
  readonly body: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={`flex flex-col rounded-[1.5rem] border border-white/10 bg-white/[0.015] p-3 ${className}`}
    >
      {/* `flex-1` sur le cadre de maquette, pas sur la cellule : dans une
          grille où les cartes ont des hauteurs différentes, c'est la maquette
          qui doit s'étirer, pour que les titres restent alignés en bas. */}
      <div className="flex flex-1 flex-col justify-center rounded-[1.1rem] border border-white/[0.07] bg-[#0c0c0d] p-5">
        {children}
      </div>
      <div className="px-2.5 pb-1 pt-5">
        <h3 className="mb-1.5 text-[1.0625rem] font-semibold tracking-[-0.01em] text-primary">
          {title}
        </h3>
        <p className="text-[0.9375rem] leading-[1.55] text-muted">{body}</p>
      </div>
    </div>
  );
}

/** Cadre à contour dégradé — la signature, réservée à ce qui est actif. */
function GlowFrame({
  children,
  className = '',
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-transparent ${className}`}
      style={{
        background:
          'linear-gradient(#111112, #111112) padding-box, linear-gradient(140deg, var(--accent-1), transparent 50%, var(--accent-2)) border-box',
      }}
    >
      {children}
    </div>
  );
}

function Lock() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function AgentGrid() {
  return (
    <Section labelledBy="grid-title" className="py-24">
      <header className="mx-auto mb-12 max-w-[46rem] text-center">
        <p className="mb-2 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-faint">
          L’agent d’acquisition
        </p>
        <h2
          id="grid-title"
          className="mb-4 text-[clamp(1.75rem,3.6vw,2.6rem)] font-bold leading-[1.12] tracking-[-0.025em] text-primary"
        >
          Une zone gratuite.
          <br />
          Les suivantes, {MONTHLY_PRICE} par mois.
        </h2>
        <p className="mx-auto max-w-[36rem] text-[1.0625rem] leading-[1.65] text-muted">
          Vous avez vu ce que l’agent trouve autour de vous. Il travaille de la même façon sur
          chaque commune où vous vous déplacez.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Cellule d'ancrage, sur deux colonnes : c'est celle que le visiteur
            vient de vivre. La placer en premier et en grand fait le lien entre
            son résultat et l'abonnement. */}
        <Cell
          className="lg:col-span-2"
          title="Votre zone, passée au crible"
          body="Vous donnez un code postal. L’agent interroge le répertoire officiel des entreprises et retient celles qui ont des véhicules à entretenir près de chez vous."
        >
          <GlowFrame className="mb-3 p-4">
            <p className="mb-1 text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
              Zone analysée
            </p>
            <p className="text-[0.9375rem] text-primary">69003 · rayon 15 km · Lyon 3e</p>
          </GlowFrame>

          {/* Des segments, pas des volumes. Le professionnel reconnaît sa
              clientèle réelle ; un compteur inventé ne survivrait pas à sa
              première vérification. */}
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: 'Flottes d’entreprise', tint: orbTints.sable },
              { label: 'Loueurs et concessions', tint: orbTints.duo },
              { label: 'Chauffeurs VTC', tint: orbTints.celadon },
              { label: 'Transport et flottes', tint: orbTints.qualifyr },
            ].map((segment) => (
              <div
                key={segment.label}
                className="flex items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
              >
                <Orb tint={segment.tint} size="1.125rem" />
                <span className="truncate text-[0.8125rem] text-muted">{segment.label}</span>
              </div>
            ))}
          </div>
        </Cell>

        {/* La cellule du mur payant. Elle montre l'objet du manque : la
            première ligne est ouverte, les suivantes sont fermées. */}
        <Cell
          title="Les communes d’à côté"
          body={`La première zone ne coûte rien. Chaque zone supplémentaire est comprise dans l’abonnement à ${MONTHLY_PRICE} par mois.`}
        >
          <div className="grid gap-2">
            <GlowFrame className="flex items-center justify-between gap-3 px-3.5 py-3">
              <span className="text-[0.875rem] text-primary">Lyon 3e</span>
              <span className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-faint">
                Ouverte
              </span>
            </GlowFrame>

            {['Villeurbanne', 'Bron', 'Vénissieux'].map((city) => (
              <div
                key={city}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.015] px-3.5 py-3"
              >
                {/* Le nom reste lisible, volontairement. Flouter la commune
                    cacherait ce qu'on vend ; c'est l'accès qui est fermé, pas
                    l'information. */}
                <span className="text-[0.875rem] text-faint">{city}</span>
                <span className="flex items-center gap-1.5 text-faint">
                  <Lock />
                </span>
              </div>
            ))}
          </div>
        </Cell>

        {/* Deuxième rangée, proportions inversées — la grille respire au lieu
            d'empiler deux rangées identiques. */}
        {/* Remplace « Il répond avant vous » (22/08/2026, audit d'avant mise
            en production).

            Cette cellule montrait l'agent répondant seul à un client, prix et
            créneaux à l'appui. Rien de tel n'existe : aucun message n'est
            jamais envoyé à un tiers, et aucun modèle de langage n'est appelé
            nulle part dans le projet. Le seul e-mail qui part va **au
            professionnel**, et contient ce que montre désormais cette
            cellule — le décompte par segment de `reportHtml()`. */}
        <Cell
          title="Ce que vous recevez"
          body="Un e-mail avec le décompte par type d’entreprise, et des exemples nominatifs à appeler. C’est vous qui prenez contact."
        >
          <div className="grid gap-2">
            {[
              { label: 'Loueurs de véhicules', count: 12 },
              { label: 'VTC et taxis', count: 31 },
              { label: 'Concessions et garages', count: 18 },
            ].map((line) => (
              <div
                key={line.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.015] px-3.5 py-3"
              >
                <span className="text-[0.8125rem] text-muted">{line.label}</span>
                <span className="text-[0.9375rem] font-bold tabular-nums text-primary">
                  {line.count}
                </span>
              </div>
            ))}
          </div>
        </Cell>

        {/* Remplace « Il apprend votre terrain » (22/08/2026, audit d'avant
            mise en production).

            Aucun mécanisme de rétroaction n'existe : l'agent ne reçoit jamais
            le résultat d'un appel, et rien dans le code ne modifie son
            comportement d'une analyse à l'autre. Promettre un apprentissage
            était la promesse la plus difficile à tenir de toute la page.

            Ce qui est vrai, et vérifiable, c'est la traçabilité : chaque
            établissement est conservé avec son SIRET, son code d'activité et
            sa base légale (`agent_prospects`, migration 010). C'est ce que
            décrit cette cellule — un argument de sérieux plutôt qu'une
            promesse d'intelligence. */}
        <Cell
          className="lg:col-span-2"
          title="Chaque ligne est vérifiable"
          body="Nom, SIRET, code d’activité, commune : tout vient du répertoire officiel. Vous pouvez recompter vous-même."
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              'Le nom et le SIRET de chaque établissement.',
              'Le code d’activité qui a servi au classement.',
              'La commune et le code postal d’implantation.',
            ].map((note) => (
              <GlowFrame key={note} className="p-3.5">
                <p className="text-[0.8125rem] leading-[1.5] text-muted">{note}</p>
              </GlowFrame>
            ))}
          </div>
        </Cell>
      </div>

      {/* La reprise du prix, après les maquettes. Le visiteur vient de voir ce
          qu'il achète ; c'est le seul moment où le montant a du sens. */}
      <div className="mx-auto mt-12 flex max-w-[34rem] flex-col items-center text-center">
        <p className="mb-1 text-[2.25rem] font-bold leading-none tracking-[-0.03em] text-primary">
          {MONTHLY_PRICE}
          <span className="text-[1rem] font-medium text-faint"> / mois</span>
        </p>
        <p className="mb-6 text-[0.9375rem] text-muted">
          Zones illimitées. Sans engagement. Le SaaS de réservation reste indépendant.
        </p>
        <a
          href="#agent-title"
          className="cta-solid accent-glow inline-flex min-h-[48px] items-center rounded-full bg-white px-6 text-[0.9375rem] font-semibold text-ink no-underline transition-colors duration-150 hover:bg-white/90"
        >
          Analyser ma zone gratuitement
        </a>
        <p className="mt-3 text-[0.8125rem] text-faint">
          Aucune carte demandée pour la première zone.
        </p>
      </div>
    </Section>
  );
}
