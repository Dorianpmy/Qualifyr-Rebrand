/**
 * Les trois agents Qualifyr — identité, rôle, couleur.
 *
 * **Un seul endroit décrit ce qu'est un agent.** Jusqu'ici, chaque composant
 * qui parlait des agents redéfinissait son propre libellé et sa propre teinte :
 * `AgentFlow`, `ServiceTabs`, `AgentGrid`, `BeforeAfterSection`, le pied de
 * page. Le résultat prévisible, c'est qu'un même agent n'a pas le même nom
 * d'une section à l'autre — « Agent d'acquisition » traînait encore dans le
 * pied de page des mois après avoir été renommé partout ailleurs.
 *
 * **La couleur identifie, elle ne décore pas.** Chaque agent porte une teinte
 * et une seule, et cette teinte ne sert qu'à le reconnaître : son badge, son
 * point d'état, la ligne verticale de sa colonne, la bordure de sa carte quand
 * elle est sélectionnée. Elle n'est jamais employée en aplat, en dégradé, en
 * fond de section ni sur du texte courant. Dès qu'une couleur n'identifie plus
 * rien, elle décore — et la charte de ce site n'en veut pas.
 *
 * **Les libellés décrivent ce que l'agent fait, pas ce qu'on aimerait vendre.**
 * `id: 'acquisition'` est le vocabulaire interne de Dorian, conservé pour les
 * noms de jetons CSS ; `label` est ce que voit le visiteur, et il dit
 * « recensement » parce que l'agent interroge un répertoire d'entreprises et
 * envoie un rapport. Il ne trouve pas de clients. Confondre les deux, c'est
 * exactement la promesse que l'audit de pré-production avait relevée.
 *
 * Les valeurs de `color` répètent volontairement celles de `tailwind.css` :
 * un module TypeScript ne peut pas lire une variable CSS, et certains usages
 * (SVG, `style` en ligne calculé) ont besoin de la valeur littérale. Le
 * commentaire est ici pour que la synchronisation soit consciente, et un test
 * la vérifie (`tests/agents.test.ts`).
 */

export type AgentId = 'acquisition' | 'reservation' | 'filtrage';

export type Agent = {
  readonly id: AgentId;
  /** Libellé montré au visiteur. */
  readonly label: string;
  /** Nom court pour les badges et les onglets étroits. */
  readonly shortLabel: string;
  /** Ce que l'agent fait, en une phrase, sans promesse. */
  readonly summary: string;
  /** Les quatre gestes de l'agent, dans l'ordre où il les exécute. */
  readonly steps: readonly string[];
  /** Teinte d'identification. Miroir du jeton CSS `--color-<id>`. */
  readonly color: string;
  /** Nom du jeton CSS correspondant, pour les usages en `var()`. */
  readonly token: `--color-${AgentId}`;
};

export const agents: readonly Agent[] = [
  {
    id: 'acquisition',
    label: 'Agent de recensement',
    shortLabel: 'Recensement',
    summary:
      'Recense les entreprises d’une zone, puis leur écrit en votre nom. Vous recevez les réponses.',
    steps: [
      'Recenser les entreprises',
      'Analyser une zone',
      'Classer par pertinence',
      'Écrire le premier message',
      'Vous transmettre les réponses',
    ],
    color: '#b8e3c5',
    token: '--color-acquisition',
  },
  {
    id: 'reservation',
    label: 'Agent de réservation',
    shortLabel: 'Réservation',
    summary:
      'Affiche le prix, propose les créneaux disponibles et encaisse l’acompte sans intervention.',
    steps: [
      'Afficher le prix',
      'Gérer les créneaux',
      'Encaisser l’acompte',
      'Confirmer la réservation',
    ],
    color: '#9ecbff',
    token: '--color-reservation',
  },
  {
    id: 'filtrage',
    label: 'Agent de filtrage',
    shortLabel: 'Filtrage',
    summary:
      'Qualifie la demande, identifie le véhicule et réduit les allers-retours avant le rendez-vous.',
    steps: [
      'Qualifier la demande',
      'Identifier le véhicule',
      'Filtrer les informations',
      'Réduire les échanges',
    ],
    color: '#d4b5ed',
    token: '--color-filtrage',
  },
] as const;

/** Accès direct par identifiant, pour les composants qui n'en affichent qu'un. */
export const agentById: Readonly<Record<AgentId, Agent>> = Object.fromEntries(
  agents.map((agent) => [agent.id, agent]),
) as Readonly<Record<AgentId, Agent>>;
