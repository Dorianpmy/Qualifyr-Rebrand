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
      'Aux dirigeants d’entreprises de nettoyage automobile mobile et aux professionnels du detailing à domicile. Que vous travailliez seul ou avec une petite équipe, sur une ville ou sur un secteur plus large.',
  },
  {
    question: 'Qualifyr travaille-t-il uniquement avec le nettoyage automobile mobile ?',
    answer:
      'Oui. C’est un choix, pas une limite provisoire. Les contraintes du métier — déplacement, zone, type et état du véhicule, durée de prestation, accès à l’eau et à l’électricité — sont connues d’avance, et c’est ce qui rend le travail utile dès le premier échange.',
  },
  {
    question: 'Est-ce seulement une création de site ?',
    answer:
      'Non. Le site est un maillon. Ce que nous construisons, c’est l’enchaînement complet : la façon dont on vous découvre, dont on comprend vos formules, dont on réserve, dont on reçoit les bonnes informations, puis dont on laisse un avis et revient.',
  },
  {
    question: 'Peut-on intégrer une prise de rendez-vous ?',
    answer:
      'Oui. Nous mettons en place le parcours de demande — véhicule, prestation, adresse, zone couverte, créneau souhaité — et nous pouvons configurer l’outil de rendez-vous qui vous convient.',
  },
  {
    question: 'Dois-je changer tous mes outils ?',
    answer:
      'Non. Nous partons de ce que vous utilisez déjà. L’objectif est de faire tenir les choses ensemble, pas d’ajouter une couche de plus à apprendre.',
  },
  {
    question: 'Qualifyr gère-t-il mon calendrier à ma place ?',
    answer:
      'Non. Nous pouvons configurer le système de rendez-vous et le relier au reste du parcours, mais vous restez maître de votre calendrier : vos créneaux, vos disponibilités, vos décisions. Nous n’y intervenons pas au quotidien.',
  },
  {
    question: 'Peut-on conserver WhatsApp ?',
    answer:
      'Oui. Beaucoup de clients écrivent par message, et c’est très bien. Le parcours sert justement à ce que la conversation démarre avec les informations déjà réunies : véhicule, prestation souhaitée, adresse, secteur.',
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
