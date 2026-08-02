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
    eyebrow: 'Expertise · Nettoyage automobile mobile',
    title: 'Un parcours clair, de la formule au rendez-vous.',
    lead:
      'Qualifyr aide les professionnels du nettoyage automobile et du detailing à présenter leurs prestations, leur zone d’intervention et la façon de réserver sans perdre le client dans les détails.',
    secondaryHref: '/realisations/sw-car-cleaning',
    secondaryLabel: 'Voir SW Carcleaning',
  },
  problems: {
    eyebrow: 'Ce qui freine la demande',
    title: 'Votre travail peut être précis. Le parcours doit l’être aussi.',
    lead:
      'Avant de confier son véhicule, un client cherche surtout à comprendre ce qui lui convient et comment avancer.',
    items: [
      {
        number: '01',
        title: 'Des formules difficiles à comparer',
        body: 'Le client hésite entre plusieurs niveaux de soin sans voir clairement ce qui change pour son véhicule.',
      },
      {
        number: '02',
        title: 'Une zone d’intervention incertaine',
        body: 'La question du déplacement arrive trop tard et crée des échanges qui auraient pu être évités.',
      },
      {
        number: '03',
        title: 'Des demandes incomplètes',
        body: 'Type de véhicule, prestation souhaitée et disponibilité manquent au moment du premier message.',
      },
    ],
  },
  response: {
    eyebrow: 'Ce que Qualifyr construit',
    title: 'Une présentation qui aide le client à décider.',
    lead:
      'Nous relions votre positionnement, votre identité et votre site dans un même parcours, pensé pour le téléphone comme pour l’ordinateur.',
    items: [
      {
        number: '01',
        title: 'Une offre immédiatement lisible',
        body: 'Les prestations, les différences entre formules et les informations utiles sont organisées dans l’ordre des questions du client.',
      },
      {
        number: '02',
        title: 'Un site à la hauteur du soin apporté',
        body: 'L’identité, les images et les textes rendent votre méthode tangible sans exagérer ce que vous faites.',
      },
      {
        number: '03',
        title: 'Une demande mieux préparée',
        body: 'Le véhicule, la prestation, la zone et le créneau souhaité peuvent être réunis avant le premier échange.',
      },
    ],
  },
  journey: {
    eyebrow: 'Parcours adapté au métier',
    title: 'Les bonnes informations, dans le bon ordre.',
    lead:
      'Chaque étape répond à une question réelle du client et prépare la suivante sans transformer la réservation en formulaire interminable.',
    steps: [
      { number: '01', title: 'Découvrir', body: 'Comprendre votre niveau de soin et votre zone.' },
      { number: '02', title: 'Choisir', body: 'Comparer les formules selon le besoin réel.' },
      { number: '03', title: 'Préciser', body: 'Indiquer le véhicule et les informations utiles.' },
      { number: '04', title: 'Demander', body: 'Proposer un créneau ou commencer un échange préparé.' },
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
      question: 'Travaillez-vous uniquement avec le nettoyage automobile mobile ?',
      answer:
        'Cette page s’adresse au nettoyage automobile mobile et au detailing à domicile. Nous adaptons le parcours à vos prestations, à votre zone et à votre manière de recevoir les demandes.',
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
    title: 'Votre savoir-faire mérite un parcours aussi soigné que vos prestations.',
    body:
      'Présentez-nous vos formules, votre zone et votre façon de travailler. Nous verrons ce qui doit devenir plus simple pour vos clients.',
  },
};

export const conciergeVertical: VerticalServiceContent = {
  route: '/conciergerie',
  hero: {
    eyebrow: 'Expertise · Conciergeries',
    title: 'Un accompagnement clair avant le premier échange.',
    lead:
      'Qualifyr aide les conciergeries à expliquer leur rôle, rassurer leurs prospects et recueillir une demande suffisamment précise pour commencer sur de bonnes bases.',
    secondaryHref: '/laboratoire',
    secondaryLabel: 'Voir le concept Qualifyr',
  },
  problems: {
    eyebrow: 'Ce qui freine la confiance',
    title: 'Un service sur mesure reste difficile à saisir sans cadre clair.',
    lead:
      'Le prospect doit comprendre jusqu’où va votre accompagnement avant de vous confier son séjour, son bien ou son organisation.',
    items: [
      {
        number: '01',
        title: 'Un périmètre difficile à expliquer',
        body: 'Les prestations varient selon le besoin et peuvent sembler floues lorsqu’elles sont présentées comme une longue liste.',
      },
      {
        number: '02',
        title: 'Des demandes sans contexte',
        body: 'Destination, dates, contraintes et niveau d’accompagnement manquent souvent au premier message.',
      },
      {
        number: '03',
        title: 'Une confiance à construire à distance',
        body: 'La qualité du service doit être perceptible avant même qu’un échange personnel ait commencé.',
      },
    ],
  },
  response: {
    eyebrow: 'Ce que Qualifyr construit',
    title: 'Une expérience qui pose le cadre et rassure.',
    lead:
      'Nous transformons un accompagnement parfois complexe en une présentation calme, structurée et facile à parcourir.',
    items: [
      {
        number: '01',
        title: 'Un positionnement compréhensible',
        body: 'Le rôle de la conciergerie, les besoins couverts et la façon d’être accompagné sont expliqués sans jargon.',
      },
      {
        number: '02',
        title: 'Une identité cohérente',
        body: 'Le ton, les images, les couleurs et la composition forment une présence crédible d’un support à l’autre.',
      },
      {
        number: '03',
        title: 'Une demande guidée',
        body: 'Le prospect peut partager le contexte essentiel avant le premier échange, sans devoir écrire un message à partir de rien.',
      },
    ],
  },
  journey: {
    eyebrow: 'Parcours adapté au métier',
    title: 'Du besoin exprimé à un échange utile.',
    lead:
      'Le parcours reste court, mais il prépare la conversation avec les éléments qui comptent vraiment pour votre équipe.',
    steps: [
      { number: '01', title: 'Comprendre', body: 'Identifier votre approche et le cadre du service.' },
      { number: '02', title: 'Se situer', body: 'Reconnaître le besoin ou le type d’accompagnement.' },
      { number: '03', title: 'Préciser', body: 'Partager le lieu, les dates et les attentes essentielles.' },
      { number: '04', title: 'Échanger', body: 'Commencer une conversation déjà contextualisée.' },
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
        'La méthode peut s’adapter à une conciergerie de séjour, de gestion, de services, d’installation ou d’accompagnement. Le projet commence par la réalité de votre offre, pas par une catégorie imposée.',
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
      question: 'Dois-je déjà avoir défini toutes mes prestations ?',
      answer:
        'Non. La clarification de l’offre fait partie du travail. Nous vous aidons à distinguer ce qui doit être expliqué publiquement de ce qui se précise pendant l’échange.',
    },
    {
      question: 'Comment commence le projet ?',
      answer:
        'Nous examinons votre accompagnement, les demandes que vous recevez et les informations qui vous manquent aujourd’hui. Le diagnostic permet de poser ce cadre avant de parler de solution.',
    },
  ],
  cta: {
    eyebrow: 'Votre conciergerie',
    title: 'Faites comprendre la qualité de votre accompagnement avant le premier échange.',
    body:
      'Présentez-nous votre service, les demandes que vous recevez et ce qui reste difficile à expliquer. Nous clarifierons la prochaine étape utile.',
  },
};

export const verticalMethod = sharedMethod;
