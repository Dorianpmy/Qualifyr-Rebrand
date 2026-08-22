'use client';

import { useState, type ReactNode } from 'react';
import { Section } from './Section';

/**
 * Services, en onglets et maquettes.
 *
 * **Le composant accepte deux à quatre services.** La grille des onglets et la
 * mise en page du panneau s'adaptent au nombre réel : deux onglets ne
 * s'étirent pas sur toute la largeur, quatre ne se compriment pas. Un service
 * sans maquette bascule automatiquement sur une colonne unique centrée, plutôt
 * que de laisser un vide à droite là où l'illustration aurait dû être.
 *
 * **Les onglets sont des vrais boutons dans un `tablist`.** Un jeu d'onglets
 * construit avec des `div` cliquables est invisible au clavier et muet pour un
 * lecteur d'écran ; ici les flèches gauche et droite naviguent, comme dans
 * n'importe quelle application.
 *
 * **Le panneau ne se démonte pas entre deux onglets.** Seul son contenu change,
 * ce qui évite le saut de hauteur que provoquerait un remplacement complet et
 * garde la page stable sous le doigt.
 */

export type Service = {
  readonly id: string;
  /** Libellé de l'onglet — court, deux ou trois mots. */
  readonly tab: string;
  readonly title: string;
  readonly body: string;
  /** Maquette. Absente, le texte occupe seul le panneau, centré. */
  readonly visual?: ReactNode;
};

export function ServiceTabs({
  eyebrow,
  heading,
  services,
}: {
  readonly eyebrow: string;
  readonly heading: string;
  readonly services: readonly Service[];
}) {
  const [active, setActive] = useState(0);
  const current = services[active] ?? services[0];

  if (!current) return null;

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = (active + delta + services.length) % services.length;
    setActive(next);
    document.getElementById(`tab-${services[next]?.id}`)?.focus();
  }

  return (
    <Section labelledBy="services-title" className="py-24">
      <header className="mx-auto mb-10 max-w-[46rem] text-center">
        <p className="mb-2 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-faint">
          {eyebrow}
        </p>
        <h2
          id="services-title"
          className="text-[clamp(1.75rem,3.6vw,2.6rem)] font-bold leading-[1.12] tracking-[-0.025em] text-primary"
        >
          {heading}
        </h2>
      </header>

      {/* Barre d'onglets : une pastille par service, dans un cadre unique.
          Le cadre extérieur donne l'impression d'un sélecteur, pas de boutons
          épars. */}
      <div
        role="tablist"
        aria-label="Services"
        onKeyDown={onKeyDown}
        className="mx-auto mb-8 flex w-fit max-w-full flex-wrap justify-center gap-1 rounded-full border border-white/10 bg-white/[0.02] p-1.5"
      >
        {services.map((service, index) => {
          const selected = index === active;
          return (
            <button
              key={service.id}
              id={`tab-${service.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${service.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              className={`tab-pill transition-colors duration-150 motion-reduce:transition-none ${
                selected ? '' : '!text-faint hover:!text-muted'
              }`}
            >
              {service.tab}
            </button>
          );
        })}
      </div>

      {/* Le grand panneau. `isolate` confine les halos à l'intérieur : sans lui
          un flou de 96 px déborderait sur les sections voisines. */}
      <div
        id={`panel-${current.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${current.id}`}
        className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-6 sm:p-10 lg:p-14"
      >
        {/* Halos d'arrière-plan. `pointer-events-none` est indispensable :
            une tache floue plein cadre intercepterait sinon tous les clics. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 -z-10 size-[26rem] rounded-full opacity-[0.14] blur-3xl"
          style={{ background: 'var(--accent-1)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-24 -z-10 size-[30rem] rounded-full opacity-[0.12] blur-3xl"
          style={{ background: 'var(--accent-2)' }}
        />

        {current.visual ? (
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
            <div className="order-2 lg:order-1">{current.visual}</div>
            <div className="order-1 lg:order-2">
              <h3 className="mb-3 text-[clamp(1.25rem,2vw,1.7rem)] font-bold leading-[1.2] tracking-[-0.015em] text-primary">
                {current.title}
              </h3>
              <p className="max-w-[38ch] text-[1.0625rem] leading-[1.65] text-muted">
                {current.body}
              </p>
            </div>
          </div>
        ) : (
          /* Sans maquette, le texte se recentre et se resserre — un paragraphe
             seul étalé sur toute la largeur du panneau serait illisible. */
          <div className="mx-auto max-w-[42rem] py-6 text-center">
            <h3 className="mb-3 text-[clamp(1.4rem,2.4vw,2rem)] font-bold leading-[1.2] tracking-[-0.02em] text-primary">
              {current.title}
            </h3>
            <p className="text-[1.0625rem] leading-[1.65] text-muted">{current.body}</p>
          </div>
        )}
      </div>
    </Section>
  );
}

/**
 * Pastille d'agent.
 *
 * **Les visuels remplacent les dégradés dessinés en CSS.** Un dégradé calculé
 * par le navigateur reste un aplat lisse ; ces images ont une matière, des
 * bords irréguliers, un grain — c'est ce qui les fait exister comme des objets
 * plutôt que comme des ronds de couleur.
 *
 * **Elles sont détourées, pas posées sur un fond.** Les fichiers d'origine ont
 * un fond crème qui aurait dessiné un carré clair sur le noir du site. Le
 * masque circulaire est rentré de 2 % : le bord des disques est flou, et un
 * masque à la taille exacte laissait une auréole du fond d'origine.
 *
 * **Un seul visuel par rôle, toujours le même.** L'agent principal porte le
 * disque sable et céladon — la charte. Les trois sous-agents ont chacun le
 * leur, et ne changent pas d'une section à l'autre : le professionnel doit
 * pouvoir reconnaître « celui qui cherche » d'un écran au suivant.
 */
export function Orb({
  tint,
  size = '2.25rem',
  label,
}: {
  /** Chemin d'un visuel d'agent, ou dégradé CSS pour les usages sans image. */
  readonly tint?: string;
  readonly size?: string;
  /** Initiales, pour les listes de personnes. Absent, la pastille reste nue. */
  readonly label?: string;
}) {
  /*
   * Repli si `tint` manque. Le composant plantait sur `tint.startsWith` quand
   * la valeur arrivait indéfinie ; une pastille absente n'est pas une raison
   * de faire tomber toute la page. La constante est écrite en dur ici,
   * volontairement : l'importer depuis `agent-visuals` recréerait la
   * dépendance que ce repli doit précisément couvrir.
   */
  const fill = tint ?? 'linear-gradient(145deg, #f2d5b3, #b8cfe4)';
  const isImage = fill.startsWith('/');

  return (
    <span
      aria-hidden="true"
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{
        inlineSize: size,
        blockSize: size,
        ...(isImage
          ? { backgroundImage: `url(${fill})`, backgroundSize: 'cover' }
          : { background: fill }),
      }}
    >
      {/* Le reflet ne s'applique qu'aux dégradés calculés : posé sur un visuel,
          il en délaverait la matière, qui est précisément ce qu'on veut voir. */}
      {isImage ? null : (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(60% 55% at 32% 28%, rgba(255,255,255,0.55), transparent 70%)',
          }}
        />
      )}
      {label ? (
        <span className="relative text-[0.6875rem] font-bold text-ink/75">{label}</span>
      ) : null}
    </span>
  );
}


/**
 * Carte interne des maquettes.
 *
 * La bordure en dégradé passe par deux fonds superposés — l'un peint le
 * contenu, l'autre la bordure. `border-image` ne suit pas les coins arrondis.
 */
export function GlowCard({
  children,
  className = '',
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-transparent p-4 ${className}`}
      style={{
        /* Bordure dégradée par double calque + `background-clip` (fond uni en
           `padding-box`, dégradé en `border-box`). Passé du raccourci
           `background` (origine/clip empilés par calque dans une seule
           déclaration) aux propriétés longues séparées : signalé le
           22/08/2026 sur capture d'écran (Safari iOS) — un coin carré de la
           couleur du dégradé dépassait du coin arrondi. Le raccourci
           multi-calque avec une origine/un clip différents par calque est un
           point connu d'incohérence entre moteurs de rendu ; les propriétés
           longues (`background-image`/`background-origin`/`background-clip`)
           sont la forme la plus largement supportée de cette technique. */
        backgroundImage:
          'linear-gradient(#101011, #101011), linear-gradient(140deg, var(--accent-1), transparent 45%, var(--accent-2))',
        backgroundOrigin: 'padding-box, border-box',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      {children}
    </div>
  );
}

