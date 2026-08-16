import { Section } from './Section';
import { orbTints } from './agent-visuals';
import { Orb } from './ServiceTabs';

/**
 * Avant / après — la friction actuelle contre le résultat.
 *
 * **Pourquoi ce bloc convertit.** Les sections de fonctionnalités décrivent le
 * produit ; celle-ci décrit la journée du lecteur. Un laveur qui se reconnaît
 * dans « le devis qu'on rédige le soir » a déjà admis le problème — et on ne
 * vend pas une solution à quelqu'un qui n'a pas admis le problème.
 *
 * **La colonne « avant » n'est pas rouge.** La palette n'a pas d'accent, et
 * peindre les frictions en rouge transformerait le bloc en avertissement
 * système. Le contraste se fait par le texte barré et l'opacité : le passé est
 * littéralement effacé.
 *
 * **Deux cartes symétriques, deux visuels.** Cette section vivait à côté de
 * `ComboSection`, qui répétait presque mot pour mot les mêmes points sous une
 * autre forme. `ComboSection` a été retirée de la page ; le rôle qu'elle
 * jouait — présenter le système, pas seulement lister des points — est repris
 * par l'en-tête de chaque carte. À gauche, des bulles de messages clients
 * dispersées : le bruit désordonné d'aujourd'hui. À droite, l'agent central et
 * ses trois rôles déjà vus dans `AgentFlow` : le même bruit, trié et traité.
 */

const before = [
  'Le téléphone qui sonne pendant que vous êtes en cabine',
  'Un devis rédigé le soir, pour un client qui ne répond plus',
  'Le créneau bloqué pour quelqu’un qui ne viendra pas',
  'Le trajet estimé à la louche, facturé à perte',
  'La prospection remise à « quand j’aurai le temps »',
] as const;

const after = [
  'Le client réserve seul, prix et durée affichés',
  'Un montant ferme accepté avant même le rendez-vous',
  'Acompte encaissé — le créneau est tenu',
  'Adresse géocodée, distance calculée, frais justes',
  'Un agent travaille votre zone pendant que vous lavez',
] as const;

/**
 * Les trois rôles déjà présentés dans `AgentFlow`, repris ici en pastilles
 * flottantes autour de l'agent central. Le visiteur les a vus une fois plus
 * haut sur la page ; les retrouver ici confirme qu'il s'agit du même système,
 * pas d'un nouveau concept à apprendre.
 *
 * **Position en style en ligne, pas en classes Tailwind.** Un premier essai
 * avec des classes `left-0 top-0` etc. stockées dans ce tableau ne
 * produisait rien à l'écran — les quatre pastilles s'empilaient toutes au
 * même endroit, comme si `top`/`left`/`right`/`bottom` n'étaient jamais
 * appliqués. Le style en ligne contourne le problème sans avoir à en trouver
 * la cause exacte.
 */
const workers = [
  { name: 'Agent Prospection', style: { left: 0, top: 0 } },
  { name: 'Agent Filtrage', style: { right: 0, top: 0 } },
  { name: 'Agent Mémoire', style: { bottom: 0, left: '50%', transform: 'translateX(-50%)' } },
] as const;

/**
 * Le bruit d'aujourd'hui : des demandes réelles, dispersées, sans qu'on les
 * ait triées. Le miroir de l'agent central en face — même volume de
 * messages, mais un côté les subit et l'autre les traite. Même remarque que
 * `workers` sur le style en ligne.
 */
const clientNoise = [
  { text: 'C’est combien pour une Clio ?', style: { left: 0, top: 0 } },
  { text: 'Vous pouvez passer dans 20 min ?', style: { right: 0, top: '1.5rem' } },
  { text: 'Finalement je vais annuler', style: { bottom: '2rem', left: '1rem' } },
  { text: 'Vous êtes où ? Ça fait 10 min', style: { bottom: 0, right: 0 } },
] as const;

export function BeforeAfterSection() {
  return (
    <Section labelledBy="before-after-title" className="py-24">
      <header className="mx-auto mb-12 max-w-[46rem] text-center">
        <p className="mb-2 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-faint">
          Ce qui change
        </p>
        <h2 id="before-after-title" className="mb-4 text-section">
          Votre semaine, avant et après.
        </h2>
        <p className="text-xl leading-[1.6] text-muted">
          Rien de ce qui suit n’est un gain de temps théorique. Ce sont les cinq moments où votre
          journée déraille aujourd’hui.
        </p>
      </header>

      {/* `items-stretch` : sans lui les deux cartes prennent chacune la
          hauteur de son contenu, et celle de droite (plus courte une fois le
          visuel retiré de la gauche) flotte plus haut que celle de gauche. */}
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        {/* Colonne « avant » : les demandes réelles, en désordre, en miroir de
            l'agent qui les trie en face. Un laveur qui reconnaît « c'est
            combien pour une Clio ? » sait déjà de quoi parle la carte d'à
            côté. */}
        <div
          className="flex flex-col rounded-[1.25rem] p-6 sm:p-8"
          style={{
            background: '#0f0f10',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Même hauteur d'en-tête qu'en face, pour que les deux pilules
              « Aujourd'hui » / « Avec Qualifyr » s'alignent. Repli sans les
              bulles sous 640 px, comme le visuel de droite. */}
          {/* `position` en style en ligne : la classe `relative` seule ne
              tenait pas (les bulles se positionnaient contre un ancêtre bien
              plus large que ce conteneur, probablement le wrapper de
              `Section`). `overflow: hidden` en filet de sécurité, pour que le
              débordement reste visible et contenu si ça se reproduit. */}
          {/* Hauteur et largeur maximale en style en ligne aussi : si `h-28`
              perd la même bataille de spécificité que `relative` plus haut,
              un conteneur sans hauteur et sans enfant en flux normal (tout
              est en `position: absolute`) s'effondre à 0 px — invisible même
              avec du contenu dedans. */}
          <div
            className="mx-auto mb-8 hidden sm:block"
            style={{
              position: 'relative',
              overflow: 'hidden',
              height: '7rem',
              width: '100%',
              maxWidth: '22rem',
            }}
          >
            {clientNoise.map((message) => (
              <span
                key={message.text}
                style={{ position: 'absolute', ...message.style }}
                className="max-w-[11rem] rounded-2xl rounded-bl-md border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-[0.75rem] leading-[1.4] text-faint"
              >
                {message.text}
              </span>
            ))}
          </div>

          <p
            className="mb-7 inline-flex w-fit rounded-full px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-faint"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Aujourd’hui
          </p>
          <ul className="grid gap-4">
            {before.map((item) => (
              <li key={item} className="flex gap-3 text-[1.0625rem] leading-[1.5] text-faint">
                <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-white/20" />
                <span className="line-through decoration-white/15">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonne « après » : le contour tricolore de `.node-hero`, la même
            signature que l'agent central d'`AgentFlow`. C'est la seule carte
            qui porte le visuel — le contraste entre une carte nue et une
            carte vivante dit « système » mieux qu'un texte ne le ferait. */}
        <div className="node-hero flex flex-col rounded-[1.25rem] p-6 sm:p-8">
          {/* En-tête : l'agent et ses trois rôles, déjà vus dans le schéma
              plus haut. Repli sans les pastilles flottantes sous 640 px —
              trois libellés autour d'un disque de 3,5 rem n'ont pas la place
              de respirer sur un petit écran. */}
          <div
            className="mx-auto mb-8 hidden items-center justify-center sm:flex"
            style={{
              position: 'relative',
              overflow: 'hidden',
              height: '7rem',
              width: '100%',
              maxWidth: '22rem',
            }}
          >
            <Orb tint={orbTints.qualifyr} size="3.5rem" />
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

          {/* La pilule est le seul aplat blanc de la section. Elle portait
              `bg-white` en utilitaire, écrasé par le `!important` de
              `.surface-pill` — d'où le fond sombre et le texte illisible. */}
          <p
            className="mb-7 inline-flex w-fit rounded-full px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em]"
            style={{ backgroundColor: '#ffffff', color: '#0e0e0f' }}
          >
            Avec Qualifyr
          </p>
          <ul className="grid gap-4">
            {after.map((item) => (
              <li key={item} className="flex gap-3 text-[1.0625rem] leading-[1.5] text-primary">
                {/* La coche prend le céladon : c'est le seul endroit de la
                    section où la couleur porte une information — ce qui est
                    acquis, par opposition au texte barré d'en face. */}
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="mt-1.5 size-4 shrink-0 fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]"
                  style={{ stroke: 'var(--accent-2)' }}
                >
                  <path d="M3 8.5l3.2 3.2L13 4.8" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
