'use client';

import type { ReactNode } from 'react';
import { Section } from './Section';
import { orbTints } from './agent-visuals';
import { Orb } from './ServiceTabs';
import { StepLoadingBar } from './StepLoadingBar';

/**
 * Avant / après — la friction actuelle contre le résultat, côte à côte.
 *
 * **Pourquoi ce bloc convertit.** Les sections de fonctionnalités décrivent le
 * produit ; celle-ci décrit la journée du lecteur. Un laveur qui se reconnaît
 * dans « le devis qu'on rédige le soir » a déjà admis le problème — et on ne
 * vend pas une solution à quelqu'un qui n'a pas admis le problème.
 *
 * **Les deux colonnes sont visibles en même temps, sans bascule.** Une
 * version précédente cachait l'une des deux derrière un sélecteur
 * « Sans Qualifyr / Avec Qualifyr » : un visiteur pressé ne cliquait jamais
 * dessus et ne voyait donc qu'une moitié de l'argument. Voir « avant » et
 * « après » d'un même regard, sans action requise, fait le travail de
 * comparaison à la place du lecteur plutôt que de le lui demander. Sur
 * téléphone, les colonnes s'empilent — « Sans Qualifyr » toujours en premier,
 * puis « Avec Qualifyr » juste en dessous : on ne raconte le problème avant la
 * solution.
 *
 * **Les cinq lignes restent les mêmes concepts des deux côtés.** La ligne
 * « téléphone » reste la ligne « téléphone » dans les deux colonnes — seuls le
 * texte et le repère (croix ou coche) changent. Le lecteur retrouve chaque
 * ligne à la même position des deux côtés, sans avoir à la rechercher.
 *
 * **L'écart entre les colonnes n'est pas décoratif.** La carte « Avec
 * Qualifyr » porte `.node-hero`, dont le halo (`box-shadow`, jusqu'à 34px de
 * flou) déborde dans toutes les directions, y compris vers la gauche —
 * directement dans la carte voisine si l'écart est trop faible. `gap-10`
 * (2,5rem, 40px) laisse ce flou se dissiper avant d'atteindre « Sans
 * Qualifyr », par le même raisonnement que l'écart utilisé ailleurs dans ce
 * fichier entre la bascule des tarifs et une carte `.node-hero` voisine.
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
  'C’est combien pour une Clio ?',
  'Vous pouvez passer dans 20 min ?',
  'Finalement je vais annuler',
  'Vous êtes où ? Ça fait 10 min',
] as const;

/**
 * Icône + titre + corps + barre de progression pour une ligne, dans l'une ou
 * l'autre colonne. Partagé entre les deux pour que les cinq lignes restent
 * visuellement identiques des deux côtés — seuls le texte, le style barré et
 * la couleur du titre changent.
 */
function RowItem({
  row,
  index,
  active,
}: {
  readonly row: Row;
  readonly index: number;
  readonly active: boolean;
}) {
  const Icon = row.icon;
  return (
    <li className="flex flex-col gap-3.5">
      <div className="flex gap-3.5">
        {/* Le contour reprend le dégradé tricolore déjà porté par la carte
            « Avec Qualifyr » (voir `.node-hero` dans `tailwind.css`) — un
            seul motif de couleur répété dix fois (cinq lignes × deux
            colonnes), pas dix teintes différentes.

            La couleur du glyphe est posée en `style`, pas via `text-faint` +
            `currentColor` : combinée au double fond (`padding-box`/
            `border-box`) de la bordure dégradée, la classe utilitaire
            cessait de s'appliquer en production — icônes invisibles alors
            que le contour restait visible. Une couleur écrite en dur gagne
            toujours, quelle que soit la cause exacte de l'échec de la
            cascade. */}
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
          <p
            className={`text-[0.9375rem] font-semibold leading-[1.35] ${active ? 'text-primary' : 'text-muted line-through decoration-white/20'}`}
          >
            {active ? row.afterTitle : row.beforeTitle}
          </p>
          <p className="mt-0.5 text-[0.8125rem] leading-[1.5] text-faint">
            {active ? row.afterBody : row.beforeBody}
          </p>
        </div>
      </div>
      <StepLoadingBar index={index} />
    </li>
  );
}

export function BeforeAfterSection() {
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
      </header>

      {/* Deux colonnes, toujours visibles. `items-start` : la carte
          « Avec Qualifyr » ne doit pas s'étirer à la hauteur de sa voisine
          si l'une des deux devient plus haute qu'attendu (texte agrandi par
          le navigateur, traduction plus longue). */}
      <div className="mx-auto grid max-w-[64rem] items-start gap-10 sm:grid-cols-2">
        <div
          className="flex flex-col rounded-[1.5rem] p-6 sm:p-8"
          style={{ background: '#0f0f10', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="mx-auto mb-7 hidden w-full max-w-[20rem] sm:block">
            {/* Bulles bleues façon iMessage, alignées à droite comme des
                messages envoyés. Coin inférieur droit moins arrondi que les
                trois autres : c'est la convention visuelle de la « queue »
                de bulle sur iOS, reconnaissable même sans la pointe
                elle-même. Empilées en flux normal, pas à des coordonnées
                fixes : un texte plus long que prévu pousse la bulle
                suivante au lieu de la recouvrir. */}
            <div className="flex w-full flex-col items-end gap-2">
              {clientNoise.map((message) => (
                <span
                  key={message}
                  className="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2 text-[0.8125rem] leading-[1.4] text-white"
                  style={{ background: '#0a84ff' }}
                >
                  {message}
                </span>
              ))}
            </div>
          </div>

          <p
            className="mb-6 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em]"
            style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-faint)' }}
          >
            <CrossIcon />
            Sans Qualifyr
          </p>

          <ul className="grid gap-4">
            {rows.map((row, index) => (
              <RowItem key={row.beforeTitle} row={row} index={index} active={false} />
            ))}
          </ul>
        </div>

        <div className="node-hero flex flex-col rounded-[1.5rem] p-6 sm:p-8">
          <div className="mx-auto mb-7 hidden w-full max-w-[20rem] sm:block">
            {/* Montage libre : l'orbe au centre, les trois rôles autour, à
                des coins fixes — quatre éléments qui ne se chevauchent
                jamais quel que soit le texte, contrairement à une pile de
                bulles. */}
            <div
              className="relative mx-auto flex items-center justify-center"
              style={{ height: '6.5rem', width: '100%' }}
            >
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
            </div>
          </div>

          {/* Seul aplat blanc de la section : marque ce qui est acquis. */}
          <p
            className="mb-6 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em]"
            style={{ backgroundColor: '#ffffff', color: '#0e0e0f' }}
          >
            <CheckIcon />
            Avec Qualifyr
          </p>

          <ul className="grid gap-4">
            {rows.map((row, index) => (
              <RowItem key={row.afterTitle} row={row} index={index} active />
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
