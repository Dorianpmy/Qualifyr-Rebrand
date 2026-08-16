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
      /** Capture, servie en repli quand aucune adresse publique n'est fournie. */
      readonly image: (typeof swCarCleaning.gallery)[number];
      readonly externalUrl?: string | undefined;
      readonly domain?: string | undefined;
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
  readonly route: '/nettoyage-automobile';
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
  readonly outcomes?: {
    readonly eyebrow: string;
    readonly title: string;
    readonly lead: string;
    readonly items: readonly EditorialItem[];
  };
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
      'Nous nous concentrons sur le nettoyage automobile et le detailing. Voici ce que cette spécialisation vous fait gagner concrètement.',
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
    externalUrl: swCarCleaning.externalUrl ?? undefined,
    domain: 'swcarcleaning.ch',
    link: '/realisations/sw-car-cleaning',
    linkLabel: 'Voir comment nous l’avons construit',
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
        'Nous partons de vos prestations, de votre zone d’intervention et de la façon dont les demandes arrivent aujourd’hui, pour identifier ce qui doit être clarifié en premier.',
    },
  ],
  cta: {
    eyebrow: 'Votre activité',
    title: 'Moins de messages à traiter. Plus de créneaux réservés.',
    body:
      'Présentez-nous vos formules, votre zone et la façon dont vos clients vous contactent aujourd’hui. Nous verrons ce qui peut être simplifié en premier.',
  },
};

export const verticalMethod = sharedMethod;
