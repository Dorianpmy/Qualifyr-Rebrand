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
    answer:
      'Il répond au premier message avec vos tarifs et vos disponibilités réelles — rien qu’il puisse inventer. Dès que la conversation demande un arbitrage, elle vous revient. Il ne prend jamais d’engagement à votre place.',
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
