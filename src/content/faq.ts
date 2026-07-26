/**
 * Questions fréquentes.
 *
 * Chaque réponse doit être vraie et tenable. Aucune promesse de délai, de
 * résultat ou de tarif n'est formulée ici tant qu'elle n'est pas un engagement
 * réel (voir AGENTS.md, §6).
 */

export type FaqItem = {
  readonly question: string;
  readonly answer: string;
};

export const faq: readonly FaqItem[] = [
  {
    question: 'À qui s’adresse Qualifyr ?',
    answer:
      'Aux dirigeants d’entreprises de nettoyage automobile mobile, aux professionnels du detailing à domicile et aux conciergeries. Que vous travailliez seul ou avec une petite équipe, sur une zone précise ou plusieurs destinations.',
  },
  {
    question: 'Travaillez-vous avec tous les métiers ?',
    answer:
      'Non. Qualifyr se concentre actuellement sur le nettoyage automobile mobile et les conciergeries afin de proposer un accompagnement réellement adapté.',
  },
  {
    question: 'Quelle différence entre les deux verticales ?',
    answer:
      'La méthode reste la même : clarifier l’offre, recueillir les bonnes informations, faciliter la demande, confirmer et prolonger la relation. Le parcours change selon le métier : véhicule, formule et zone d’intervention pour le nettoyage automobile ; besoin, séjour, destination ou accompagnement pour une conciergerie.',
  },
  {
    question: 'Est-ce seulement une création de site ?',
    answer:
      'Non. Le site est un maillon. Ce que nous construisons, c’est l’enchaînement complet : la façon dont on vous découvre, dont on comprend vos formules, dont on réserve, dont on reçoit les bonnes informations, puis dont on laisse un avis et revient.',
  },
  {
    question: 'Peut-on intégrer une prise de rendez-vous ?',
    answer:
      'Oui. Nous mettons en place le parcours de demande adapté à votre activité et nous pouvons configurer l’outil de rendez-vous qui vous convient.',
  },
  {
    question: 'Dois-je changer tous mes outils ?',
    answer:
      'Non. Nous partons de ce que vous utilisez déjà. L’objectif est de faire tenir les choses ensemble, pas d’ajouter une couche de plus à apprendre.',
  },
  {
    question: 'Le client reste-t-il maître de son calendrier ?',
    answer:
      'Oui. Nous pouvons configurer le système de rendez-vous et le relier au reste du parcours, mais vous restez maître de votre calendrier : vos créneaux, vos disponibilités et vos décisions. Nous n’y intervenons pas au quotidien.',
  },
  {
    question: 'Peut-on conserver WhatsApp ?',
    answer:
      'Oui. Le parcours sert justement à ce que la conversation démarre avec les informations utiles déjà réunies, qu’il s’agisse d’un véhicule, d’une prestation, d’un séjour, d’une destination ou d’un besoin d’accompagnement.',
  },
  {
    question: 'Comment commence l’accompagnement ?',
    answer:
      'Par un échange sur votre activité : ce que vous proposez, où vous intervenez, comment les demandes vous arrivent aujourd’hui et ce qui vous freine. Nous identifions ensuite les améliorations les plus utiles pour vous.',
  },
  {
    question: 'Proposez-vous des publicités ?',
    answer:
      'Ce n’est pas ce que contient l’accompagnement de base. Nous travaillons d’abord les fondations : ce que vous proposez, comment on le comprend, comment on réserve. Investir en publicité sur un parcours qui n’est pas clair revient à payer pour amener des clients vers un point de blocage.',
  },
  {
    question: 'Puis-je vous contacter si mon activité démarre seulement ?',
    answer:
      'Oui. Un démarrage est même un bon moment : les habitudes ne sont pas encore prises, et la structure se met en place plus simplement. Nous en parlons et nous vous disons franchement ce qui est utile maintenant et ce qui peut attendre.',
  },
] as const;
