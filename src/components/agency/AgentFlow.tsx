'use client';

import { useState, type ReactNode } from 'react';
import { Section } from './Section';
import { orbTints } from './agent-visuals';
import { Orb } from './ServiceTabs';

/**
 * L'agent d'acquisition — schéma du travail, puis capture de zone.
 *
 * **Les sous-agents sont nommés, l'agent principal ne l'est pas.** « Agent
 * Prospection », « Agent Filtrage », « Agent Mémoire » décrivent une fonction :
 * le visiteur n'a rien à mémoriser, il lit ce que fait chacun. Un nom propre
 * pour l'ensemble l'obligerait au contraire à retenir une entité de plus avant
 * d'avoir compris à quoi elle sert.
 *
 * **Le schéma vend mieux qu'un paragraphe.** Une arborescence rend visible ce
 * qui serait invisible autrement : le fait qu'il se passe plusieurs choses,
 * en parallèle, sans le professionnel. C'est exactement l'argument.
 *
 * **Ce composant n'invente aucun chiffre.** Annoncer « 47 clients potentiels
 * autour de vous » sans donnée derrière serait un chiffre faux montré à
 * quelqu'un qui va le vérifier sur son terrain. On capture la zone, on
 * confirme, et l'analyse part par e-mail quand il y a quelque chose à dire.
 */

type Phase = 'idle' | 'scanning' | 'captured';

/** Cinq chiffres en France, quatre en Suisse — les deux marchés visés. */
function isValidZone(value: string): boolean {
  return /^\d{4,5}$/.test(value.trim());
}

/* 16 px : en dessous, Safari agrandit la page au focus et n'en revient jamais.
   Sur un formulaire de capture, c'est la conversion qui part. */
const fieldClass =
  'w-full min-w-0 min-h-[48px] rounded-[10px] border border-hairline bg-white/[0.03] px-3.5 text-[16px] text-primary placeholder:text-faint transition-colors duration-150 focus:border-white/40 focus:bg-white/[0.06] focus:outline-none';

/**
 * Connecteurs du schéma.
 *
 * **Pourquoi un SVG et pas des bordures CSS.** Une fourche vers trois colonnes
 * demande des courbes ; en CSS il faudrait empiler des pseudo-éléments et des
 * coins arrondis, qui se décalent dès que la grille change de largeur. Le SVG
 * s'étire avec son conteneur.
 *
 * `preserveAspectRatio="none"` est délibéré : le tracé se déforme
 * horizontalement avec la largeur disponible, ce qui est exactement voulu —
 * les branches doivent rejoindre les colonnes, pas garder un angle constant.
 */
function Trunk() {
  return (
    <svg viewBox="0 0 2 40" preserveAspectRatio="none" className="h-10 w-px" aria-hidden="true">
      <path className="flow-line" d="M1 0 V40" />
    </svg>
  );
}

function Fork({ reversed = false }: { readonly reversed?: boolean }) {
  return (
    <svg
      viewBox="0 0 600 48"
      preserveAspectRatio="none"
      className={`h-12 w-full ${reversed ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      {/* Trois branches : gauche, centre, droite. Les courbes de Bézier
          partent verticalement du tronc et arrivent verticalement sur les
          cartes — sans quoi le raccord se voit. */}
      <path className="flow-line" d="M300 0 V16 C300 32 100 24 100 48" />
      <path className="flow-line" d="M300 0 V48" />
      <path className="flow-line" d="M300 0 V16 C300 32 500 24 500 48" />
    </svg>
  );
}

/**
 * Cadre de la charte : contour dégradé, fond quasi noir.
 *
 * Le dégradé passe par deux fonds superposés — l'un peint l'intérieur jusqu'au
 * bord du padding, l'autre la zone de bordure. `border-image` ne suivrait pas
 * les coins arrondis et déborderait aux angles.
 *
 * `variant` choisit le traitement. `node-hero` est réservé à l'agent central :
 * contour tricolore et halo, c'est le seul objet lumineux du schéma.
 * `node-result` reprend le contour sans le halo — deux objets lumineux se
 * concurrenceraient, et c'est l'agent qu'on veut voir en premier.
 */
function Node({
  children,
  variant,
  className = '',
}: {
  readonly children: ReactNode;
  /**
   * `node-hero` pour l'agent principal — contour tricolore et halo.
   * `node-result` pour le résultat — même contour, sans halo.
   * Absent, la carte prend le contour discret à deux teintes.
   */
  readonly variant?: 'node-hero' | 'node-result';
  readonly className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-5 text-start ${variant ?? 'border border-transparent'} ${className}`}
      style={
        variant
          ? undefined
          : {
              background:
                'linear-gradient(#0f0f10, #0f0f10) padding-box, linear-gradient(140deg, var(--accent-1), transparent 45%, var(--accent-2)) border-box',
            }
      }
    >
      {children}
    </div>
  );
}

const workers = [
  {
    name: 'Agent Prospection',
    body: 'Loueurs, VTC, concessions, flottes d’entreprise — dans votre rayon.',
    tint: orbTints.sable,
  },
  {
    name: 'Agent Filtrage',
    body: 'Les curieux s’arrêtent là. Ceux qui restent acceptent votre tarif.',
    tint: orbTints.duo,
  },
  {
    name: 'Agent Mémoire',
    body: 'Chaque refus lui apprend qui vous fait perdre du temps.',
    tint: orbTints.celadon,
  },
] as const;

export function AgentFlow() {
  const [zone, setZone] = useState('');
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  const ready = isValidZone(zone) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;

    setPhase('scanning');
    setError(null);

    /*
     * La route enregistre la demande et rend la main : elle n'analyse rien en
     * synchrone. Une analyse de secteur dure une à deux minutes à cause du
     * quota Sirene — une requête HTTP qui attendrait ça expirerait.
     */
    try {
      const response = await fetch('/api/agent/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone: zone.trim(), email: email.trim() }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setError(data.message ?? data.error ?? 'La demande n’a pas pu être envoyée.');
        setPhase('idle');
        return;
      }

      setPhase('captured');
    } catch {
      setError('Connexion impossible. Vérifiez votre réseau et réessayez.');
      setPhase('idle');
    }
  }

  return (
    <Section labelledBy="agent-title" className="border-y border-hairline py-24">
      <div className="mx-auto max-w-[52rem] text-center">
        <h2 id="agent-title" className="mb-4 text-[clamp(1.9rem,4vw,2.9rem)] font-bold leading-[1.1] tracking-[-0.03em] text-primary">
          Pendant que vous lavez,
          <br />
          quelqu’un remplit votre agenda.
        </h2>
        <p className="mx-auto mb-16 max-w-[34rem] text-[1.0625rem] leading-[1.65] text-muted">
          Un agent travaille votre secteur en continu. Vous ne le voyez jamais — vous voyez
          seulement les rendez-vous arriver.
        </p>

        {/* Le schéma : une entrée, trois agents, un résultat. Les connecteurs
            en pointillés animés sont tracés en SVG, seule façon d'obtenir une
            fourche qui s'étire proprement avec la largeur de la grille. */}
        <div className="grid justify-items-center gap-0">
          {/* L'entrée reste une bulle sans contour : c'est ce que dit le
              professionnel, pas un composant du système. Lui donner le même
              cadre que les agents laisserait croire qu'il en est un. */}
          <div className="w-full max-w-[30rem] surface-card p-5 text-start">
            <p className="mb-1 text-[0.75rem] uppercase tracking-[0.08em] text-faint">Votre zone</p>
            <p className="text-[0.9375rem] text-muted">
              « Detailing à domicile, 15 km autour de Lyon 3e. »
            </p>
          </div>

          <Trunk />

          <Node variant="node-hero" className="w-full max-w-[30rem]">
            <div className="flex items-center gap-3.5">
              <Orb tint={orbTints.qualifyr} size="2.5rem" />
              <div className="min-w-0">
                <p className="text-[1.0625rem] font-semibold leading-tight text-primary">
                  Votre agent d’acquisition
                </p>
                <p className="mt-1 text-[0.875rem] leading-[1.45] text-muted">
                  Il reçoit votre périmètre et répartit le travail.
                </p>
              </div>
            </div>
          </Node>

          <Fork />

          <div className="grid w-full gap-3 sm:grid-cols-3">
            {workers.map((worker) => (
              <Node key={worker.name}>
                <div className="mb-3 flex items-center gap-3">
                  <Orb tint={worker.tint} size="2.25rem" />
                  <p className="text-[0.9375rem] font-semibold leading-tight text-primary">
                    {worker.name}
                  </p>
                </div>
                <p className="text-[0.875rem] leading-[1.5] text-muted">{worker.body}</p>
              </Node>
            ))}
          </div>

          <Fork reversed />

          {/* Le résultat est nommé et situé : « un créneau réservé » ne dit pas
              où il atterrit. Le professionnel doit comprendre qu'il n'a rien à
              recopier — la réservation arrive déjà dans son espace. */}
          <Node variant="node-result" className="w-full max-w-[30rem]">
            <div className="flex items-start gap-3.5">
              <Orb tint={orbTints.qualifyr} size="2.25rem" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[0.9375rem] font-semibold text-primary">Créneau réservé</p>
                  <p className="text-[1.0625rem] font-bold tabular-nums text-primary">289 €</p>
                </div>
                <p className="mt-0.5 text-[0.875rem] text-muted">Berline · Complet · Mardi 14 h</p>

                <div className="mt-3.5 flex items-center gap-2 border-t border-hairline pt-3">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full"
                    style={{ background: 'var(--accent-2)' }}
                  />
                  <p className="text-[0.8125rem] text-faint">
                    Acompte encaissé — dans votre espace{' '}
                    <span className="text-muted">app.qualifyragence.com</span>
                  </p>
                </div>
              </div>
            </div>
          </Node>
        </div>

        {/* La capture ferme la démonstration : on vient de montrer le travail,
            on propose de le lancer. */}
        <div className="mx-auto mt-16 max-w-[34rem] border-t border-hairline pt-12">
          {phase === 'captured' ? (
            <div role="status" className="surface-card p-6 text-start">
              <p className="mb-1.5 text-[1.0625rem] font-semibold text-primary">
                C’est parti pour {zone}.
              </p>
              <p className="text-[0.9375rem] leading-[1.6] text-muted">
                Le secteur passe au crible, entreprise par entreprise — comptez quelques heures, le
                répertoire officiel ne se laisse pas lire en vitesse. Le rapport atterrit dans {email} dès
                qu’il y a quelque chose à vous montrer.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-3">
              <p className="text-[0.9375rem] text-muted">
                Donnez-lui un secteur. Il vous dit ce qu’il y a à y prendre.
              </p>
              <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  aria-label="Code postal"
                  placeholder="69003"
                  maxLength={5}
                  value={zone}
                  className={fieldClass}
                  onChange={(event) => setZone(event.target.value.replace(/\D/g, ''))}
                />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  aria-label="Adresse e-mail"
                  placeholder="vous@atelier.fr"
                  value={email}
                  className={fieldClass}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={!ready || phase === 'scanning'}
                className="cta-solid mx-auto mt-2 min-h-[48px] cursor-pointer rounded-full bg-white px-7 text-[0.9375rem] font-semibold text-ink transition-colors duration-150 hover:not-disabled:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/50"
              >
                {phase === 'scanning' ? 'Analyse en cours…' : 'Analyser mon secteur'}
              </button>
              {error ? (
                <p role="alert" className="text-[0.8125rem]" style={{ color: 'var(--accent-1)' }}>
                  {error}
                </p>
              ) : null}
              <p className="text-[0.8125rem] text-faint">
                Gratuit. Une analyse par zone, France pour l’instant.
              </p>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}
