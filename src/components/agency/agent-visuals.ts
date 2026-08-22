/**
 * Visuels et dégradés des pastilles d'agents.
 *
 * **Pourquoi un fichier séparé de `ServiceTabs.tsx`.** Ces constantes y
 * vivaient, mais ce module porte la directive `'use client'`. Or Next remplace
 * *tous* les exports d'un module client par des références client lorsqu'un
 * composant serveur les importe — y compris les exports qui ne sont pas des
 * composants. `orbTints` arrivait donc à `undefined` dans `AgentGrid` et
 * `services-content`, qui sont rendus sur le serveur.
 *
 * Tant que les valeurs servaient de dégradés CSS, la panne était invisible :
 * une propriété `background` indéfinie est simplement ignorée. Le jour où le
 * composant a lu `tint.startsWith('/')` pour distinguer une image d'un
 * dégradé, la page a planté.
 *
 * Un module sans directive est importable des deux côtés sans transformation.
 */

/**
 * Les visuels d'agents.
 *
 * `qualifyr` est le disque de la charte — sable et céladon. Il est réservé à
 * l'agent principal : le donner à un rôle secondaire diluerait le seul visuel
 * qui représente la marque.
 */
export const orbTints = {
  /**
   * Agent principal — celui qui représente Dorian personnellement, donc le
   * bleu (choix de Dorian, 22/08/2026 : « mon perso est le bleu »).
   * Visuel original de Dorian (22/08/2026), pas une recréation.
   */
  qualifyr: '/images/agents/qualifyr.webp',
  sable: '/images/agents/agent-a.webp',
  duo: '/images/agents/agent-b.webp',
  celadon: '/images/agents/agent-c.webp',
} as const;

/**
 * Dégradés pour les avatars de personnes.
 *
 * Distincts des visuels d'agents, et pour une raison de fond : les disques
 * sable et céladon représentent le système. Les poser sur « Sofia M. » ou
 * « Thomas L. » laisserait entendre que ces lignes sont des agents, alors
 * qu'elles désignent des clients. Un monogramme sur un dégradé simple dit ce
 * qu'il est — un être humain dont on n'a pas la photo.
 */
export const personTints = {
  sable: 'linear-gradient(145deg, #f7e2c6, #e8b98a)',
  celadon: 'linear-gradient(145deg, #cdeade, #93c9b8)',
} as const;
