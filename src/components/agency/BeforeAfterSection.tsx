'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Section } from './Section';
import { orbTints } from './agent-visuals';
import { Orb } from './ServiceTabs';

/**
 * Avant / après — la friction actuelle contre le résultat, en bascule.
 *
 * **Pourquoi ce bloc convertit.** Les sections de fonctionnalités décrivent le
 * produit ; celle-ci décrit la journée du lecteur. Un laveur qui se reconnaît
 * dans « le devis qu'on rédige le soir » a déjà admis le problème — et on ne
 * vend pas une solution à quelqu'un qui n'a pas admis le problème.
 *
 * **Une carte qui bascule, pas deux côte à côte.** La version précédente
 * posait les deux colonnes en permanence — lisible sur un écran large, mais
 * deux colonnes de cinq lignes empilées sur téléphone faisaient défiler
 * longtemps avant d'atteindre la suite de la page. Une bascule « Sans
 * Qualifyr / Avec Qualifyr » ramène la comparaison à une seule carte, dans
 * les deux formats — inspirée d'une référence envoyée (une page concurrente
 * qui traite le même argument ainsi), reconstruite dans la charte du site :
 * une seule icône par ligne, jamais cinq couleurs différentes — la charte
 * n'autorise la couleur qu'à deux endroits sur la page (voir la note de
 * `DarkHero`), et une pastille par ligne dans cinq teintes en ferait un
 * troisième, puis un quatrième.
 *
 * **Les cinq lignes restent les mêmes concepts des deux côtés.** La ligne
 * « téléphone » reste la ligne « téléphone » qu'on soit sur « avant » ou
 * « après » — seul le texte et le repère (croix ou coche) changent. Ça
 * évite au lecteur de rechercher où est passée « sa » ligne quand il bascule.
 */

type Row = {
  readonly icon: () => ReactNode;
  readonly beforeTitle: string;
  readonly beforeBody: string;
  readonly afterTitle: string;
  readonly afterBody: string;
};

const rows: readonly Row[] = [
  {
    icon: () => (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 4.5c0 8.3 6.7 15 15 15l2-3.6-5.1-2.4-1.6 1.9a12 12 0 0 1-6.2-6.2l1.9-1.6L8.1 2.5Z" />
      </svg>
    ),
    beforeTitle: 'Interruptions en pleine prestation',
    beforeBody: 'Le téléphone qui sonne pendant que vous êtes en cabine, sur un véhicule.',
    afterTitle: 'Réservation en autonomie',
    afterBody: 'Le client réserve seul : prix et durée sont déjà affichés.',
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 3h8l3.5 3.5V21h-11.5Z" />
        <path d="M9 9.3h6M9 12.8h6M9 16.3h3.3" />
      </svg>
    ),
    beforeTitle: 'Devis écrits pour rien',
    beforeBody: 'Un devis rédigé le soir, pour un client qui ne répond déjà plus.',
    afterTitle: 'Prix ferme accepté à l’avance',
    afterBody: 'Un montant ferme est accepté avant même le rendez-vous.',
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="5" width="17" height="15" rx="2.3" />
        <path d="M3.5 9.8h17M8 3v3.4M16 3v3.4" />
      </svg>
    ),
    beforeTitle: 'Créneaux bloqués sans garantie',
    beforeBody: 'Un créneau retenu par téléphone, pour quelqu’un qui ne viendra pas.',
    afterTitle: 'Acompte encaissé au clic',
    afterBody: 'Le créneau est tenu — l’acompte est déjà encaissé.',
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21.2s7-7.4 7-12.3a7 7 0 1 0-14 0c0 4.9 7 12.3 7 12.3Z" />
        <circle cx="12" cy="8.9" r="2.4" />
      </svg>
    ),
    beforeTitle: 'Déplacements estimés à la louche',
    beforeBody: 'La distance et le trajet évalués au jugé, souvent facturés à perte.',
    afterTitle: 'Trajet calculé, frais justes',
    afterBody: 'Adresse géocodée, distance calculée, déplacement facturé juste.',
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M19.5 19.5 15 15" />
      </svg>
    ),
    beforeTitle: 'Prospection remise à plus tard',
    beforeBody: 'Trouver de nouveaux clients attend « quand j’aurai le temps » — donc n’arrive jamais.',
    afterTitle: 'Un agent qui prospecte pour vous',
    afterBody: 'Il travaille votre zone pendant que vous lavez.',
  },
];

function CrossIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5l3.2 3.2L13 4.8" />
    </svg>
  );
}

/**
 * Les trois rôles déjà présentés dans `AgentFlow`, repris en pastilles
 * flottantes autour de l'agent central — l'en-tête visuel du côté « après ».
 */
const workers = [
  { name: 'Agent Prospection', style: { left: 0, top: 0 } },
  { name: 'Agent Filtrage', style: { right: 0, top: 0 } },
  { name: 'Agent Mémoire', style: { bottom: 0, left: '50%', transform: 'translateX(-50%)' } },
] as const;

/** Le bruit d'aujourd'hui, en en-tête visuel du côté « avant ». */
const clientNoise = [
  { text: 'C’est combien pour une Clio ?', style: { left: 0, top: 0 } },
  { text: 'Vous pouvez passer dans 20 min ?', style: { right: 0, top: '1.5rem' } },
  { text: 'Finalement je vais annuler', style: { bottom: '2rem', left: '1rem' } },
  { text: 'Vous êtes où ? Ça fait 10 min', style: { bottom: 0, right: 0 } },
] as const;

export function BeforeAfterSection() {
  const [after, setAfter] = useState(false);

  /*
   * Barre animée sous l'en-tête — inspirée d'une référence envoyée (une barre
   * de progression sur une page concurrente). Purement décorative : elle ne
   * représente aucune statistique, seulement le mouvement de bascule que le
   * bloc s'apprête à montrer. Après l'audit qui a retiré le faux « +100
   * utilisateurs » ailleurs sur le site, hors de question d'habiller une
   * barre qui grandit avec un chiffre qu'on ne mesure pas — la charte
   * dégradée (sable/lilas/céladon) suffit à faire l'effet sans rien
   * affirmer.
   *
   * Se remplit une seule fois, à l'entrée dans le viewport : `once` évite
   * qu'elle se relance en boucle à chaque scroll de va-et-vient, ce qui
   * userait l'effet plus vite qu'il ne convainc.
   */
  const barRef = useRef<HTMLDivElement>(null);
  const [barFilled, setBarFilled] = useState(false);

  useEffect(() => {
    const el = barRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setBarFilled(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setBarFilled(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Section labelledBy="before-after-title" className="py-24">
      <header className="mx-auto mb-10 max-w-[46rem] text-center">
        <p className="mb-2 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-faint">
          Ce qui change
        </p>
        <h2 id="before-after-title" className="mb-4 text-section">
          Votre semaine, avant et après.
        </h2>
        <p className="mb-6 text-xl leading-[1.6] text-muted">
          Rien de ce qui suit n’est un gain de temps théorique. Ce sont les cinq moments où votre
          journée déraille aujourd’hui.
        </p>
        <div
          ref={barRef}
          aria-hidden="true"
          className="mx-auto h-[3px] w-full max-w-[14rem] overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full"
            style={{
              width: barFilled ? '100%' : '0%',
              background: 'linear-gradient(90deg, var(--accent-1), var(--accent-3) 50%, var(--accent-2))',
              transition: 'width 1100ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      </header>

      {/* La bascule — mêmes classes que `.period-switch`/`.period-option`
          dans `tailwind.css`, déjà éprouvées pour les tarifs : un vrai
          `radiogroup` au clavier, pas des `div` cliquables muettes.

          `mb-12` et non `mb-8` : la carte en dessous porte `.node-hero`
          côté « après », dont le halo (`box-shadow`, jusqu'à 34px de flou,
          sans décalage) déborde dans toutes les directions y compris vers le
          haut. À 2rem d'écart, ce halo baignait la bascule elle-même — texte
          qui se lit mal, contours qui se brouillent. 3rem laisse le flou se
          dissiper avant d'atteindre les boutons. */}
      <div className="mb-12 flex justify-center">
        <div role="radiogroup" aria-label="Avant ou après Qualifyr" className="period-switch">
          <button
            type="button"
            role="radio"
            aria-checked={!after}
            onClick={() => setAfter(false)}
            className="period-option"
          >
            <CrossIcon />
            Sans Qualifyr
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={after}
            onClick={() => setAfter(true)}
            className="period-option"
          >
            <CheckIcon />
            Avec Qualifyr
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[38rem]">
        <div
          className={
            after
              ? 'node-hero flex flex-col rounded-[1.5rem] p-6 sm:p-8'
              : 'flex flex-col rounded-[1.5rem] p-6 sm:p-8'
          }
          style={after ? undefined : { background: '#0f0f10', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* En-tête visuel : le bruit du côté « avant », l'agent et ses
              rôles côté « après ». Repli sans lui sous 640 px — l'un comme
              l'autre perdent leur lisibilité en dessous de cette largeur. */}
          <div
            className="mx-auto mb-7 hidden items-center justify-center sm:flex"
            style={{ position: 'relative', overflow: 'hidden', height: '6.5rem', width: '100%', maxWidth: '20rem' }}
          >
            {after ? (
              <>
                <Orb tint={orbTints.qualifyr} size="3.25rem" />
                {workers.map((worker) => (
                  <span
                    key={worker.name}
                    style={{ position: 'absolute', ...worker.style }}
                    className="surface-pill px-3 py-1 text-[0.75rem] font-medium text-muted"
                  >
                    {worker.name}
                  </span>
                ))}
              </>
            ) : (
              clientNoise.map((message) => (
                <span
                  key={message.text}
                  style={{ position: 'absolute', ...message.style }}
                  className="max-w-[11rem] rounded-2xl rounded-bl-md border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-[0.75rem] leading-[1.4] text-faint"
                >
                  {message.text}
                </span>
              ))
            )}
          </div>

          {/* La pastille d'état — repère de ce qui est affiché, comme sur la
              référence. Croix et sable pour « avant », coche et blanc plein
              pour « après » : le seul aplat blanc de la section marque ce qui
              est acquis. */}
          <p
            className="mb-6 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em]"
            style={
              after
                ? { backgroundColor: '#ffffff', color: '#0e0e0f' }
                : { border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-faint)' }
            }
          >
            {after ? <CheckIcon /> : <CrossIcon />}
            {after ? 'Avec Qualifyr' : 'Sans Qualifyr'}
          </p>

          <ul className="grid gap-4">
            {rows.map((row) => {
              const Icon = row.icon;
              return (
                <li key={row.beforeTitle} className="flex gap-3.5">
                  {/* Le contour reprend le dégradé tricolore déjà porté par la
                      carte elle-même (voir `.node-hero` dans `tailwind.css`) —
                      un seul motif de couleur répété cinq fois, pas cinq
                      teintes différentes. Ça reste dans l'esprit « la couleur
                      n'apparaît qu'à deux endroits » : c'est la même
                      signature qui se prolonge sur les icônes, pas une
                      troisième zone colorée.

                      La couleur du glyphe est posée en `style`, pas via
                      `text-faint` + `currentColor` : combinée au double fond
                      (`padding-box`/`border-box`) de la bordure dégradée, la
                      classe utilitaire cessait de s'appliquer en production —
                      icônes invisibles alors que le contour restait visible.
                      Même symptôme, même remède que la carte tarifaire
                      sombre plus haut dans le projet : une couleur écrite en
                      dur gagne toujours, quelle que soit la cause exacte de
                      l'échec de la cascade. */}
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-[1rem]"
                    style={{
                      border: '1px solid transparent',
                      background:
                        'linear-gradient(#141416, #141416) padding-box, linear-gradient(135deg, var(--accent-1), var(--accent-3) 50%, var(--accent-2)) border-box',
                      color: '#9a9a9c',
                    }}
                  >
                    <Icon />
                  </span>
                  <div>
                    <p className={`text-[0.9375rem] font-semibold leading-[1.35] ${after ? 'text-primary' : 'text-muted line-through decoration-white/20'}`}>
                      {after ? row.afterTitle : row.beforeTitle}
                    </p>
                    <p className="mt-0.5 text-[0.8125rem] leading-[1.5] text-faint">
                      {after ? row.afterBody : row.beforeBody}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Section>
  );
}
