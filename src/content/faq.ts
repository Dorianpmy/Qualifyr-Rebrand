/**
 * Questions fréquentes — detailing / nettoyage automobile uniquement.
 */

export type FaqItem = {
  readonly question: string;
  readonly answer: string;
};

export const faq: readonly FaqItem[] = [
  {
    question: 'À qui s’adresse Qualifyr ?',
    answer:
      'Aux laveurs auto à domicile, en France et en Suisse. Que vous travailliez seul ou avec une petite équipe, sur une zone précise.',
  },
  {
    question: 'Travaillez-vous avec tous les métiers ?',
    answer:
      'Non. Qualifyr se concentre sur le nettoyage automobile à domicile afin de proposer un accompagnement et un outil réellement adaptés à ce métier.',
  },
  {
    question: 'Proposez-vous seulement un site internet ?',
    answer:
      'Non. Le site est un maillon. Nous construisons l’enchaînement : être trouvé, comprendre les formules, réserver un créneau, envoyer les bonnes infos (véhicule, photos), puis confirmer. Nous proposons aussi Qualifyr, un outil de réservation en ligne pour laveurs auto.',
  },
  {
    question: 'Qu’est-ce que l’outil de réservation Qualifyr ?',
    answer:
      'C’est l’outil SaaS : chaque laveur auto a une page de réservation (formules, estimation, photos, créneau). Les demandes arrivent dans un espace pro pour confirmer. Ce n’est pas un site vitrine sur mesure : c’est un produit en abonnement.',
  },
  {
    question: 'Peut-on intégrer une prise de rendez-vous ?',
    answer:
      'Oui. Nous mettons en place le parcours de demande adapté à votre activité, ou vous utilisez directement l’outil de réservation Qualifyr pour centraliser les créneaux.',
  },
  {
    question: 'Dois-je changer tous mes outils ?',
    answer:
      'Non. Nous partons de ce que vous utilisez déjà. L’objectif est de faire tenir les choses ensemble, pas d’ajouter une couche inutile.',
  },
  {
    question: 'Le client reste-t-il maître de son calendrier ?',
    answer:
      'Oui. Vous restez maître de vos créneaux, disponibilités et décisions. Nous n’intervenons pas dans votre planning au quotidien.',
  },
  {
    question: 'Peut-on conserver WhatsApp ?',
    answer:
      'Oui. Le parcours sert à démarrer la conversation avec les infos utiles déjà réunies (véhicule, formule, zone, photos), pour moins d’allers-retours.',
  },
  {
    question: 'Comment commence l’accompagnement ?',
    answer:
      'Par un échange sur votre activité : formules, zone, comment les demandes arrivent aujourd’hui, et ce qui freine. Nous identifions ensuite les priorités.',
  },
  {
    question: 'Proposez-vous des publicités ?',
    answer:
      'Ce n’est pas le cœur de l’accompagnement de base. Nous travaillons d’abord les fondations : offre claire, parcours de réservation. La pub sur un parcours flou amplifie le problème.',
  },
  {
    question: 'Puis-je vous contacter si mon activité démarre seulement ?',
    answer:
      'Oui. Un démarrage est un bon moment : la structure se met en place plus simplement. Nous disons franchement ce qui est utile maintenant et ce qui peut attendre.',
  },
  {
    question: 'Comment reçoit-on la facture de l’abonnement ?',
    answer:
      'Stripe génère automatiquement une facture pour chaque abonnement et l’envoie par e-mail. La transmission via une plateforme agréée sera mise en place conformément au calendrier légal applicable.',
  },
] as const;
