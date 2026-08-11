import type { FaqItem } from './faq';
import { method } from './home';
import { swCarCleaning } from './sw-car-cleaning';
import type { Route } from '@/types';

type EditorialItem = {
  readonly number: string;
  readonly title: string;
  readonly body: string;
};

type VerticalProof =
  | {
      readonly kind: 'real';
      readonly eyebrow: string;
      readonly title: string;
      readonly body: string;
      readonly points: readonly string[];
      readonly image: (typeof swCarCleaning.gallery)[number];
      readonly link: Route;
      readonly linkLabel: string;
    }
  | {
      readonly kind: 'concept';
      readonly eyebrow: string;
      readonly title: string;
      readonly body: string;
      readonly points: readonly string[];
      readonly link: Route;
      readonly linkLabel: string;
    };

export type VerticalServiceContent = {
  readonly route: '/nettoyage-automobile' | '/conciergerie';
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly lead: string;
    readonly secondaryHref: Route;
    readonly secondaryLabel: string;
  };
  readonly problems: {
    readonly eyebrow: string;
    readonly title: string;
    readonly lead: string;
    readonly items: readonly EditorialItem[];
  };
  readonly response: {
    readonly eyebrow: string;
    readonly title: string;
    readonly lead: string;
    readonly items: readonly EditorialItem[];
  };
  readonly journey: {
    readonly eyebrow: string;
    readonly title: string;
    readonly lead: string;
    readonly steps: readonly EditorialItem[];
  };
  /**
   * Ce que ça change — conséquences commerciales, jamais livrables.
   *
   * `response` décrit ce que Qualifyr construit ; cette section décrit ce que
   * le client cesse de subir. Règle de rédaction : si la phrase pourrait
   * figurer sur une facture, elle n'a rien à faire ici.
   *
   * Optionnel le temps que les deux verticales soient traitées.
   */
  readonly outcomes?: {
    readonly eyebrow: string;
    readonly title: string;
    readonly lead: string;
    readonly items: readonly EditorialItem[];
  };
  /**
   * Pourquoi nous — l'argument de spécialiste.
   *
   * Le hero de l'accueil engage publiquement sur deux métiers seulement
   * (`docs/11-refonte-copywriting.md`, §2.1). Cette section est l'endroit où
   * cette promesse se démontre, faute de quoi elle reste une affirmation.
   *
   * Contrainte `AGENTS.md` §6 : la crédibilité vient de la connaissance du
   * métier et de ce qui est vérifiable — jamais d'un chiffre de résultat,
   * d'un volume de clients ou d'un témoignage. Ne rien y ajouter qui ne
   * puisse être vérifié par le lecteur lui-même.
   */
  readonly whyUs?: {
    readonly eyebrow: string;
    readonly title: string;
    readonly lead: string;
    readonly items: readonly {
      readonly title: string;
      readonly body: string;
    }[];
  };
  readonly proof: VerticalProof;
  readonly faq: readonly FaqItem[];
  readonly cta: {
    readonly eyebrow: string;
    readonly title: string;
    readonly body: string;
  };
};

const sharedMethod = method;

export const automotiveVertical: VerticalServiceContent = {
  route: '/nettoyage-automobile',
  hero: {
    eyebrow: 'Expertise · Nettoyage automobile & detailing',
    title: 'Un site qui transforme vos abonnés en réservations.',
    lead:
      'Instagram vous fait connaître, mais il ne prend pas de rendez-vous. Qualifyr conçoit le site qui présente vos formules, affiche vos tarifs par type de véhicule et transforme une visite en demande de créneau — sans passer par vingt messages privés.',
    secondaryHref: '/realisations/sw-car-cleaning',
    secondaryLabel: 'Voir SW Carcleaning',
  },
  problems: {
    eyebrow: 'Ce qui vous coûte des créneaux',
    title: 'Le travail est irréprochable. Le chemin pour réserver, beaucoup moins.',
    lead:
      'Entre le moment où quelqu’un découvre votre travail et celui où il bloque un créneau, tout se joue en quelques minutes.',
    items: [
      {
        number: '01',
        title: 'Tout se négocie en message privé',
        body: 'Disponibilités, tarifs, type de véhicule : chaque réservation demande une conversation entière, le soir, une fois les prestations terminées.',
      },
      {
        number: '02',
        title: 'Des formules impossibles à comparer',
        body: 'Le client hésite entre plusieurs niveaux de soin sans voir ce qui change concrètement pour son véhicule, et repousse sa décision.',
      },
      {
        number: '03',
        title: 'Introuvable sur Google',
        body: 'Celui qui cherche un detailer dans votre ville ne tombe jamais sur un compte Instagram. Ces clients-là, vous ne les voyez même pas passer.',
      },
    ],
  },
  response: {
    eyebrow: 'Ce que Qualifyr construit',
    title: 'Un site qui répond à votre place.',
    lead:
      'Votre Instagram reste votre vitrine — nous n’y touchons pas. Le site prend le relais là où il s’arrête : comparer, décider, réserver.',
    items: [
      {
        number: '01',
        title: 'Des formules et des tarifs lisibles',
        body: 'Les prestations et les prix par type de véhicule sont organisés dans l’ordre des questions du client. La moitié des messages disparaît d’elle-même.',
      },
      {
        number: '02',
        title: 'Une demande de créneau complète',
        body: 'Le client choisit sa prestation, précise son véhicule et propose une disponibilité. Vous recevez un dossier, plus un « bonjour, c’est combien ? ».',
      },
      {
        number: '03',
        title: 'Une présence sur Google',
        body: 'Vos prestations et votre zone d’intervention deviennent trouvables par ceux qui ne vous suivent pas encore — et qui cherchent maintenant.',
      },
    ],
  },
  journey: {
    eyebrow: 'Parcours adapté au métier',
    title: 'Les bonnes informations, dans le bon ordre.',
    lead:
      'Chaque étape répond à une question réelle du client et prépare la suivante, sans transformer la réservation en formulaire interminable.',
    steps: [
      { number: '01', title: 'Découvrir', body: 'Voir votre niveau de finition et votre zone.' },
      { number: '02', title: 'Choisir', body: 'Comparer les formules selon son véhicule.' },
      { number: '03', title: 'Préciser', body: 'Indiquer le véhicule, l’état et le lieu.' },
      { number: '04', title: 'Réserver', body: 'Proposer un créneau avec tout ce qu’il vous faut.' },
    ],
  },
  outcomes: {
    eyebrow: 'Ce que ça change',
    title: 'Trois choses cessent, le jour où le site est juste.',
    lead:
      'Ce ne sont pas des fonctionnalités. Ce sont les situations que vous ne vivez plus une fois que le parcours fait son travail.',
    items: [
      {
        number: '01',
        title: 'Vous récupérez vos soirées',
        body: 'Les tarifs, les durées, les disponibilités et la zone d’intervention répondent pendant que vous travaillez. Les messages qui restent sont ceux qui méritent une réponse — pas les vingt qui demandent un prix déjà affiché.',
      },
      {
        number: '02',
        title: 'Vous cessez d’être comparé à un lavage à 15 €',
        body: 'Tant que rien ne montre l’écart entre passer un rouleau et corriger une peinture, votre prix paraît élevé sans raison. Quand le niveau de soin se voit avant le tarif, le tarif cesse d’être le sujet.',
      },
      {
        number: '03',
        title: 'Vous ne vous déplacez plus pour rien',
        body: 'Véhicule, état réel, lieu d’intervention, accès à l’eau et à l’électricité : la demande arrive avec ce qu’il faut pour savoir si le créneau est tenable. Les mauvaises surprises se règlent avant le trajet, pas devant le portail.',
      },
    ],
  },
  whyUs: {
    eyebrow: 'Pourquoi nous',
    title: 'Nous connaissons vos objections mieux que votre prochaine agence.',
    lead:
      'Nous ne faisons des sites que pour deux métiers. Voici ce que cette restriction vous fait gagner concrètement.',
    items: [
      {
        title: 'Nous n’écrirons pas « lavage » sur votre site',
        body: 'Une agence généraliste range le detailing dans « nettoyage de voiture », confond une correction de peinture avec un polissage et vend une protection céramique comme une cire. Vos clients avertis le voient en une phrase — et ce sont eux qui paient le plus cher.',
      },
      {
        title: 'Nous savons ce qu’il demande avant de réserver',
        body: 'Combien de temps ça prend. Si les rayures partent vraiment. Ce qui se passe si le véhicule est plus sale que prévu. Où vous vous installez, et ce dont vous avez besoin sur place. Ces réponses ne sont pas des détails à caser en bas de page : ce sont elles qui débloquent la réservation.',
      },
      {
        title: 'Vous pouvez vérifier notre travail en ligne',
        body: 'SW Carcleaning est en ligne, publique, ouvrable maintenant. Nous préférons un site que vous pouvez juger vous-même à une liste de logos et de chiffres que personne ne vérifie jamais.',
      },
      {
        title: 'Vous restez propriétaire de tout',
        body: 'Le nom de domaine, les contenus, les accès, les photographies de vos véhicules. Aucun abonnement construit pour vous retenir, aucune dépendance installée exprès. Si vous partez, vous partez avec le site.',
      },
    ],
  },
  proof: {
    kind: 'real',
    eyebrow: 'Réalisation réelle',
    title: 'SW Carcleaning',
    body:
      'Une identité et un site conçus pour présenter une activité de lavage et detailing à domicile à Fribourg, clarifier les formules et faciliter la prise de contact.',
    points: ['Présentation des formules', 'Zone d’intervention visible', 'Parcours pensé pour le mobile'],
    image: swCarCleaning.gallery[0],
    link: '/realisations/sw-car-cleaning',
    linkLabel: 'Découvrir la réalisation',
  },
  faq: [
    {
      question: 'J’ai déjà Instagram, à quoi sert un site ?',
      answer:
        'Instagram vous fait découvrir, il ne fait pas réserver. Il ne classe pas vos tarifs par véhicule, ne bloque pas de créneau et n’apparaît pas quand quelqu’un cherche un detailer sur Google. Le site prend le relais exactement là où votre compte s’arrête.',
    },
    {
      question: 'Travaillez-vous uniquement avec le nettoyage automobile mobile ?',
      answer:
        'Cette page s’adresse au nettoyage automobile mobile et au detailing, à domicile comme en atelier. Nous adaptons le parcours à vos prestations, à votre zone et à votre manière de recevoir les demandes.',
    },
    {
      question: 'Puis-je conserver mon site actuel ?',
      answer:
        'Oui, si sa base est saine. Nous commençons par regarder ce qui peut être clarifié, réorganisé ou conservé avant de proposer une refonte complète.',
    },
    {
      question: 'Faut-il disposer de photographies professionnelles ?',
      answer:
        'Des images réelles et soignées aident à montrer votre niveau de travail. Nous définissons les prises de vue utiles et n’utilisons jamais de faux résultat à la place de vos prestations.',
    },
    {
      question: 'Le client peut-il choisir son véhicule et sa formule ?',
      answer:
        'Oui. Le parcours peut réunir le type de véhicule, la formule, la zone et la demande de créneau, selon ce qui est réellement utile à votre organisation.',
    },
    {
      question: 'Comment commence le projet ?',
      answer:
        'Nous partons de vos prestations, de votre zone d’intervention et de la façon dont les demandes arrivent aujourd’hui. Le diagnostic sert à identifier ce qui doit être clarifié en premier.',
    },
  ],
  cta: {
    eyebrow: 'Votre activité',
    title: 'Moins de messages à traiter. Plus de créneaux réservés.',
    body:
      'Présentez-nous vos formules, votre zone et la façon dont vos clients vous contactent aujourd’hui. Nous verrons ce qui peut être simplifié en premier.',
  },
};

export const conciergeVertical: VerticalServiceContent = {
  route: '/conciergerie',
  hero: {
    eyebrow: 'Expertise · Conciergeries de location courte durée',
    title: 'Un site qui convainc les propriétaires de vous confier leur bien.',
    lead:
      'Votre métier se joue avant la première visite : un propriétaire décide de confier un bien de plusieurs centaines de milliers d’euros à quelqu’un qu’il ne connaît pas. Qualifyr conçoit le site qui installe cette confiance et qualifie chaque demande.',
    secondaryHref: '/simulateur-revenus-locatifs',
    secondaryLabel: 'Voir le simulateur en direct',
  },
  problems: {
    eyebrow: 'Ce qui freine la signature',
    title: 'Le propriétaire ne compare pas des services. Il évalue un risque.',
    lead:
      'Avant de signer un mandat, il veut savoir ce que son bien peut rapporter, ce que vous prenez réellement en charge, et pourquoi vous plutôt qu’un autre.',
    items: [
      {
        number: '01',
        title: 'Aucune idée du revenu possible',
        body: 'Le propriétaire hésite parce qu’il ignore ce que son logement générerait vraiment. Sans ce chiffre, la conversation ne démarre jamais.',
      },
      {
        number: '02',
        title: 'Une offre qui ressemble à toutes les autres',
        body: 'Ménage, linge, accueil, gestion des annonces : la liste est la même partout, et rien n’explique ce qui vous distingue.',
      },
      {
        number: '03',
        title: 'Des demandes trop vagues pour être traitées',
        body: 'Ville, type de bien, nombre de logements et disponibilité manquent au premier message, et chaque échange s’allonge inutilement.',
      },
    ],
  },
  response: {
    eyebrow: 'Ce que Qualifyr construit',
    title: 'Un site qui fait le premier travail de conviction.',
    lead:
      'Nous transformons votre offre en un parcours qui chiffre, rassure et qualifie — avant même votre premier appel.',
    items: [
      {
        number: '01',
        title: 'Une estimation de revenus en entrée de parcours',
        body: 'Le propriétaire découvre ce que son bien pourrait générer et laisse ses coordonnées pour en savoir plus. C’est le point de départ le plus efficace du métier.',
      },
      {
        number: '02',
        title: 'Des garanties rendues visibles',
        body: 'Vos engagements, votre process, vos assurances et vos résultats rendent le risque acceptable. C’est ce que le propriétaire cherche vraiment.',
      },
      {
        number: '03',
        title: 'Une demande déjà qualifiée',
        body: 'Ville, type de logement, nombre de biens et disponibilité arrivent avec la demande. Vous cessez de perdre du temps sur les dossiers hors cible.',
      },
    ],
  },
  journey: {
    eyebrow: 'Parcours adapté au métier',
    title: 'Du premier doute au mandat signé.',
    lead:
      'Le parcours reste court, mais il traite les questions dans l’ordre où le propriétaire se les pose réellement.',
    steps: [
      { number: '01', title: 'Comprendre', body: 'Situer votre approche, votre zone et vos garanties.' },
      { number: '02', title: 'Estimer', body: 'Découvrir le revenu possible pour son bien.' },
      { number: '03', title: 'Préciser', body: 'Partager le logement, la ville et ses attentes.' },
      { number: '04', title: 'Échanger', body: 'Ouvrir une conversation déjà cadrée.' },
    ],
  },
  outcomes: {
    eyebrow: 'Ce que ça change',
    title: 'Trois choses cessent, le jour où le site est juste.',
    lead:
      'Ce ne sont pas des fonctionnalités. Ce sont les situations que vous ne vivez plus une fois que le parcours fait son travail.',
    items: [
      {
        number: '01',
        title: 'Vous arrêtez de rattraper au téléphone',
        body: 'Zone couverte, commission, ce que vous prenez en charge, ce qui reste au propriétaire : tout ce que vous répétez dix fois par semaine est écrit et lu avant qu’on vous appelle. L’échange commence là où il s’arrêtait avant.',
      },
      {
        number: '02',
        title: 'Vous cessez d’être choisi au pourcentage',
        body: 'Quand rien ne distingue deux conciergeries, le propriétaire tranche sur la commission — et vous perdez face à moins cher que vous. Une offre lisible déplace la comparaison sur le revenu qu’il touchera vraiment, pas sur ce que vous prélevez.',
      },
      {
        number: '03',
        title: 'Vous ne perdez plus les propriétaires qui hésitent',
        body: 'Confier un bien de plusieurs centaines de milliers d’euros ne se décide pas en une visite. Le parcours laisse une trace utile — une estimation, un document, une raison de revenir — au lieu de compter sur un souvenir.',
      },
    ],
  },
  whyUs: {
    eyebrow: 'Pourquoi nous',
    title: 'Nous connaissons vos objections mieux que votre prochaine agence.',
    lead:
      'Nous ne faisons des sites que pour deux métiers. Voici ce que cette restriction vous fait gagner concrètement.',
    items: [
      {
        title: 'Nous n’apprenons pas votre métier sur votre budget',
        body: 'Une agence généraliste passe la première moitié du projet à comprendre pourquoi un propriétaire ne signe pas comme un client ordinaire : il ne compare pas un service, il évalue un risque sur son patrimoine. Nous démarrons après cette étape.',
      },
      {
        title: 'Nous savons ce qu’il demande avant de dire oui',
        body: 'Combien ça rapporte. Qui détient les clés. Ce qui se passe en cas de dégât. Comment les voyageurs sont sélectionnés. À quoi il s’engage, et pour combien de temps. Ces réponses ne sont pas des mentions à caser en bas de page : ce sont elles qui déclenchent le mandat.',
      },
      {
        title: 'Nous avons construit l’outil, pas seulement le site',
        body: 'Le simulateur de revenus que nous intégrons, nous l’éditons aussi comme produit pour les conciergeries. Vous pouvez l’essayer sans nous demander la permission. Peu d’agences peuvent montrer un outil de votre métier qui tourne en production.',
      },
      {
        title: 'Vous restez propriétaire de tout',
        body: 'Le nom de domaine, les contenus, les accès, les photographies. Aucun abonnement construit pour vous retenir, aucune dépendance installée exprès. Si vous partez, vous partez avec le site.',
      },
    ],
  },
  proof: {
    kind: 'concept',
    eyebrow: 'Simulateur en ligne · Qualifyr',
    title: 'Un simulateur de revenus, testable en direct.',
    body:
      'Avant de parler mandat, montrez au propriétaire ce que son bien peut rapporter. Le simulateur que nous avons conçu pour nos clients conciergeries est utilisable dès maintenant, en démonstration.',
    points: ['Fourchette de revenus en quatre choix', 'Barèmes ajustables par zone', 'Collecte des coordonnées propriétaire'],
    link: '/simulateur-revenus-locatifs',
    linkLabel: 'Voir une estimation en direct',
  },
  faq: [
    {
      question: 'Avec quels types de conciergeries travaillez-vous ?',
      answer:
        'Principalement les conciergeries de location courte durée qui gèrent des biens pour le compte de propriétaires. La méthode s’adapte aussi aux conciergeries de services et d’accompagnement : le projet part de la réalité de votre offre, pas d’une catégorie imposée.',
    },
    {
      question: 'Pouvez-vous intégrer un simulateur de revenus locatifs ?',
      answer:
        'Oui, c’est l’élément qui déclenche le plus de demandes dans ce métier. L’estimation est présentée sous forme de fourchette indicative, calibrée sur votre zone, et sert à ouvrir la conversation — pas à engager un chiffre précis.',
    },
    {
      question: 'Le simulateur de revenus est-il vraiment fonctionnel ?',
      answer:
        'Oui. Il s’agit du même outil que nous proposons à nos clients conciergeries, présenté ici en démonstration avec des barèmes indicatifs plutôt qu’avec les vôtres.',
    },
    {
      question: 'Peut-on gérer plusieurs types de demandes ?',
      answer:
        'Oui. Le parcours peut orienter le prospect selon son besoin et recueillir uniquement les informations pertinentes pour la demande concernée.',
    },
    {
      question: 'Faut-il déjà gérer plusieurs logements ?',
      answer:
        'Non, mais le site produit son plein effet à partir de quelques biens en gestion, quand la question devient celle de la croissance. La clarification de l’offre fait partie du travail.',
    },
    {
      question: 'Comment commence le projet ?',
      answer:
        'Nous examinons votre offre, les demandes que vous recevez aujourd’hui et la façon dont vous signez vos mandats. Le diagnostic sert à identifier où se perdent les propriétaires avant de parler de solution.',
    },
  ],
  cta: {
    eyebrow: 'Votre conciergerie',
    title: 'Le prochain mandat se gagne avant le premier appel.',
    body:
      'Présentez-nous votre offre, votre zone et la façon dont les propriétaires vous trouvent aujourd’hui. Nous verrons où se perdent les demandes.',
  },
};

export const verticalMethod = sharedMethod;
