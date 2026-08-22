'use client';

import type { ReactNode } from 'react';
import { MessageBubble } from './MessageBubble';
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
    /* « Un agent qui prospecte pour vous » laissait entendre une prise de
       contact déléguée. Corrigé le 22/08/2026 : l'agent produit la liste,
       l'appel reste au professionnel. */
    afterTitle: 'La liste est prête quand vous l’êtes',
    afterBody: 'L’agent recense votre zone pendant que vous lavez. Vous n’avez plus qu’à appeler.',
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
 * Les trois rôles déjà présentés dans `AgentFlow` — l'en-tête visuel du côté
 * « après ».
 *
 * **En rangée, plus en pastilles flottantes.** La version précédente les
 * positionnait en absolu autour de l'orbe (deux en haut aux coins, une en bas
 * au centre) : sur la largeur réelle de la carte, la pastille du bas venait
 * buter contre l'orbe, et l'ensemble donnait trois étiquettes en suspens
 * plutôt qu'un système. Une rangée de trois, chacune portant sa propre orbe
 * de couleur, reprend exactement le motif déjà utilisé dans
 * `services-content.tsx` — et fait entrer les trois couleurs d'agents dans
 * une section qui n'en avait aucune.
 *
 * Noms courts (« Prospection » et non « Agent Prospection ») : trois fois le
 * mot « Agent » sur une seule rangée étroite forcerait la troncature, et le
 * mot est déjà porté par l'orbe.
 */
const workers = [
  { name: 'Prospection', tint: orbTints.sable },
  { name: 'Filtrage', tint: orbTints.duo },
  { name: 'Mémoire', tint: orbTints.celadon },
] as const;

/**
 * Le bruit d'aujourd'hui, en en-tête visuel du côté « avant ».
 *
 * Dispersé plutôt qu'empilé : deux messages au premier plan, à gauche et à
 * droite (`prominent`), deux autres en arrière-plan, plus petits (`MessageBubble
 * compact`), pour donner une impression de désordre plutôt qu'une liste bien
 * rangée — c'est le sentiment que la section décrit.
 *
 * **Bulles bleues (`#1683F8`), demande explicite du 17/08/2026, en référence
 * directe à neverboring.app (déjà l'inspiration du fichier de style — voir
 * l'en-tête de `globals.css`).** Une version précédente était passée au gris
 * neutre après un bug où le texte se lisait orange en production ; ce bug
 * venait d'une classe de couleur de texte posée à côté d'un fond en `style`
 * (perte de classe en cascade, même symptôme que `RowItem` plus bas et
 * `CompareSection.tsx`), pas du bleu en tant que tel. `MessageBubble` pose
 * fond ET texte en `style`, donc ce risque ne s'applique plus — voir ce
 * composant pour le détail.
 */
// Revu deux fois pour le même défaut, et corrigé pour de bon la seconde.
//
// 22/08/2026, première tentative : les bulles étaient posées en absolu
// (`left: 0` / `right: 0`, deux rangées à `top` fixe) en croyant que deux
// colonnes suffiraient à les séparer. Elles se chevauchaient toujours —
// « Vous pouvez passer dans 20 min ? » réduit à « …uvez …ans 20 min »,
// « Finalement je vais annuler » caché derrière « Vous êtes où ? ». La cause
// est arithmétique : une bulle large (11rem) et une compacte (9,5rem) font
// 20,5rem à elles deux dans un conteneur de 23rem, soit 2,5rem d'écart
// théorique — que la rotation (jusqu'à 6°) suffit à consommer, puisqu'elle
// élargit l'emprise horizontale de chaque bulle d'environ la moitié de sa
// hauteur multipliée par le sinus de l'angle.
//
// 22/08/2026, correctif retenu : **abandon du positionnement absolu.** Les
// bulles sont deux rangées `flex` avec `justify-between` et un `gap`. Deux
// éléments d'une même ligne flex ne peuvent structurellement pas se
// superposer, quels que soient les textes, la langue, la taille de police
// choisie par le visiteur ou la largeur de l'écran. Le désordre voulu vient
// alors de la seule rotation, qui ne déplace rien dans le flux.
const clientNoise = [
  [
    { text: 'C’est combien pour une Clio ?', prominent: true, tilt: '-3deg' },
    { text: 'Vous pouvez passer dans 20 min ?', prominent: false, tilt: '-5deg' },
  ],
  [
    { text: 'Finalement je vais annuler', prominent: false, tilt: '5deg' },
    { text: 'Vous êtes où ? Ça fait 10 min', prominent: true, tilt: '3deg' },
  ],
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
    /* `pb-4` plutôt qu'une gouttière sur la liste : à partir de `sm`, la
       liste est une sous-grille dont les gouttières sont celles de la grille
       parente (nulles, cf. le conteneur des deux colonnes). L'espacement
       entre lignes doit donc appartenir aux lignes elles-mêmes. Pas de
       padding sous la dernière, qui ferait un bas de carte plus creux que
       prévu. */
    <li className="flex flex-col gap-3.5 sm:[&:not(:last-child)]:pb-4">
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

      {/* Deux colonnes, toujours visibles — et **rigoureusement alignées
          ligne à ligne**, ce qui demande une grille commune aux deux cartes.
          `subgrid` est le seul outil qui le garantisse : les sept rangées
          (visuel d'en-tête, badge, puis les cinq lignes) sont déclarées ici,
          et chaque carte s'y abonne au lieu de calculer ses propres hauteurs.
          La rangée 4 fait donc la même hauteur des deux côtés, quel que soit
          le nombre de lignes sur lesquelles chaque texte se replie.

          Sans cela, le décalage entre colonnes **s'accumulait** de ligne en
          ligne : les libellés de gauche se replient sur deux lignes quatre
          fois sur cinq, ceux de droite une seule — d'où presque cent pixels
          d'écart en bas de section, signalé par Dorian sur capture. Une
          hauteur minimale fixe par ligne ne pouvait pas corriger ça : à la
          largeur du point de rupture `sm`, la ligne la plus longue se replie
          sur quatre lignes, contre deux sur grand écran.

          `items-start` a disparu pour la même raison : les cartes doivent
          au contraire s'étirer à la même hauteur.

          Interlignes : `gap-y-0` à partir de `sm`, l'espacement passe par
          les marges et les paddings des éléments eux-mêmes. Une gouttière
          non nulle sur la grille parente serait héritée par les
          sous-grilles, et toute tentative de la redéfinir localement
          décalerait le rendu des pistes par rapport aux positions calculées
          par le parent. */}
      <div className="mx-auto grid max-w-[64rem] gap-10 sm:grid-cols-2 sm:grid-rows-[auto_auto_auto_auto_auto_auto_auto] sm:gap-y-0">
        <div
          className="flex flex-col rounded-[1.5rem] p-6 sm:row-span-7 sm:grid sm:grid-rows-subgrid sm:p-8"
          style={{
            background: '#0f0f10',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 20px 40px -24px rgba(0,0,0,0.55)',
          }}
        >
          {/* Visible dès le mobile : la demande explicite est que ces bulles
              restent visibles sur téléphone, sans déborder de l'écran.
              `MessageBubble` réduit sa propre taille sous `sm:`, donc pas de
              dépassement à 320px même avec le texte le plus long du tableau.

              `sm:h-[9.5rem]` est la même valeur que sur la carte voisine —
              c'est ce qui met les deux badges, puis les cinq lignes, à la
              même hauteur d'une colonne à l'autre. Sans elle, les deux
              en-têtes visuels ayant des contenus de hauteurs différentes,
              chaque ligne « avant » se retrouvait décalée de sa ligne
              « après » : la comparaison ligne à ligne, qui est tout l'objet
              de cette section, ne se faisait plus. Hauteur libre sous `sm:`,
              où les colonnes sont empilées et où la question ne se pose
              pas. */}
          <div className="mx-auto mb-7 flex w-full max-w-[23rem] flex-col justify-center gap-5 sm:h-[9.5rem]">
            {clientNoise.map((row) => (
              <div key={row[0].text} className="flex items-start justify-between gap-3">
                {row.map((message) => (
                  <MessageBubble
                    key={message.text}
                    text={message.text}
                    compact={!message.prominent}
                    position="static"
                    style={{ transform: `rotate(${message.tilt})` }}
                  />
                ))}
              </div>
            ))}
          </div>

          <p
            className="mb-6 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em]"
            style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-faint)' }}
          >
            <CrossIcon />
            Sans Qualifyr
          </p>

          <ul className="grid gap-4 sm:row-span-5 sm:grid-rows-subgrid sm:gap-0">
            {rows.map((row, index) => (
              <RowItem key={row.beforeTitle} row={row} index={index} active={false} />
            ))}
          </ul>
        </div>

        <div className="node-hero flex flex-col rounded-[1.5rem] p-6 sm:row-span-7 sm:grid sm:grid-rows-subgrid sm:p-8">
          {/* L'agent au-dessus, ses trois rôles en rangée en dessous : la
              hiérarchie se lit sans qu'aucune flèche ne soit nécessaire.
              Tout est en flux normal — l'orbe ne peut plus venir buter
              contre une pastille, ce que le montage en absolu précédent
              faisait à la largeur réelle de la carte.

              Même `sm:h-[9.5rem]` que la colonne « Sans Qualifyr » : voir
              l'explication côté gauche. Visible sur mobile aussi, comme les
              bulles d'en face — masquer l'un des deux en-têtes donnait deux
              colonnes qui ne se ressemblaient plus du tout sur téléphone. */}
          <div className="mx-auto mb-7 flex w-full max-w-[23rem] flex-col items-center justify-center gap-4 sm:h-[9.5rem]">
            <Orb tint={orbTints.qualifyr} size="3.25rem" />
            <div className="grid w-full grid-cols-3 gap-2">
              {workers.map((worker) => (
                <div
                  key={worker.name}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-2.5 py-2"
                >
                  <Orb tint={worker.tint} size="1.25rem" />
                  <span className="truncate text-[0.75rem] text-muted">{worker.name}</span>
                </div>
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

          <ul className="grid gap-4 sm:row-span-5 sm:grid-rows-subgrid sm:gap-0">
            {rows.map((row, index) => (
              <RowItem key={row.afterTitle} row={row} index={index} active />
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
