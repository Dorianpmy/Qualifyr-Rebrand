/**
 * FAQ de la page d'accueil.
 *
 * **Elle répond aux objections, pas aux curiosités.** Chaque question est une
 * raison de ne pas acheter, formulée comme le professionnel se la formule à
 * lui-même. Une FAQ qui explique le fonctionnement du produit répète la page ;
 * une FAQ qui lève les freins la termine.
 *
 * **Les réponses ne promettent rien d'invérifiable.** Pas de délai de
 * rentabilité, pas de volume de clients. Chaque affirmation est constatable
 * dans les jours qui suivent l'inscription.
 */
export const homeFaq = [
  {
    question: 'Mes clients sauront-ils s’en servir ?',
    answer:
      'Le tunnel se remplit en trois minutes sur un téléphone, sans compte à créer. Vous pouvez le tester vous-même plus haut dans cette page : si vous y arrivez sans explication, vos clients aussi.',
  },
  {
    question: 'Et si le véhicule est plus sale que ce que le client a déclaré ?',
    answer:
      'Vous constatez à l’arrivée et proposez un montant ajusté ; le client reste libre de refuser. Le tunnel demande l’état réel, des photos et le lieu précis pour que l’écart soit rare — mais il ne peut pas le supprimer, et prétendre le contraire serait faux.',
  },
  {
    question: 'L’acompte, c’est vraiment utile ?',
    answer:
      'C’est ce qui distingue un créneau réservé d’un créneau espéré. Quelqu’un qui a laissé de l’argent se déplace, ou prévient. C’est aussi ce qui vous autorise à refuser un autre client sur la même heure sans prendre de risque.',
  },
  {
    question: 'L’agent va-t-il écrire n’importe quoi à mes clients ?',
    // Corrigé le 22/08/2026 (phase 4 de l'audit growth marketing). L'ancienne
    // réponse décrivait un agent conversationnel qui répond aux clients avec
    // vos tarifs et sait quand vous transférer l'échange — aucune brique de
    // ce type n'existe dans le code (agent/process se limite à un comptage
    // d'entreprises envoyé par e-mail, voir reportHtml). La vraie réponse à
    // cette objection est en fait plus rassurante que celle qu'elle
    // remplace : l'agent ne parle à aucun client, donc le risque qu'il
    // décrit n'existe pas.
    answer:
      'Non — il ne parle jamais à vos clients à votre place. Il repère les entreprises de votre secteur et vous envoie leurs informations par e-mail : c’est vous qui décidez quoi écrire, et à qui.',
  },
  {
    question: 'Je travaille en Suisse, ça marche ?',
    answer:
      'Oui. Les montants s’affichent en francs, la TVA s’applique au taux local, les codes postaux à quatre chiffres et les numéros en +41 sont acceptés, et les factures portent les mentions attendues.',
  },
  {
    question: 'Si j’arrête, je perds tout ?',
    answer:
      'Vos réservations, vos clients et vos photos avant/après vous appartiennent et s’exportent. L’abonnement se résilie depuis votre espace, sans préavis ni appel à passer.',
  },
] as const;
