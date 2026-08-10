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
    secondaryHref: '/laboratoire',
    secondaryLabel: 'Voir le concept Qualifyr',
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
  proof: {
    kind: 'concept',
    eyebrow: 'Exploration créative · Concept Qualifyr',
    title: 'Une conciergerie présentée avec calme et précision.',
    body:
      'Cette étude interne explore une direction éditoriale, une hiérarchie de services et un parcours de demande. Elle illustre une piste de travail et ne correspond pas à un projet client livré.',
    points: ['Compréhension du besoin', 'Cadre de l’accompagnement', 'Passage vers un échange'],
    link: '/laboratoire',
    linkLabel: 'Explorer le concept',
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
      question: 'Cette page présente-t-elle un client Qualifyr ?',
      answer:
        'Non. La composition présentée est un Concept Qualifyr, créé pour explorer une direction possible. Elle est volontairement distinguée de nos réalisations clients.',
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
