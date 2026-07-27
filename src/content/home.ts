import { objectives, swCarCleaning } from './sw-car-cleaning';

export const hero = {
  eyebrow: 'Sites web, applications et produits digitaux',
  title: 'Des sites et produits digitaux pensés pour être utilisés, compris et rentables.',
  body: 'Qualifyr conçoit des sites web, des applications et des SaaS modernes pour transformer une idée ou un besoin métier en expérience digitale concrète.',
} as const;

/** Conservé pour la composition éditoriale réutilisée par le design system. */
export const heroMoments = [
  { number: '01', label: 'Comprendre' },
  { number: '02', label: 'Convaincre' },
  { number: '03', label: 'Passer à l’action' },
] as const;

export const offerBlocks = [
  {
    number: '01',
    title: 'Une offre plus claire',
    body: 'Nous structurons vos services pour que vos prospects comprennent rapidement ce que vous proposez.',
  },
  {
    number: '02',
    title: 'Un site pensé pour agir',
    body: 'Chaque page guide vers une demande, une réservation ou un échange utile.',
  },
  {
    number: '03',
    title: 'Un parcours mieux organisé',
    body: 'Les informations importantes arrivent au bon moment, sans compliquer votre quotidien.',
  },
] as const;

export const sectors = [
  {
    title: 'Nettoyage automobile mobile et detailing',
    body: 'Présentez clairement vos formules, votre zone d’intervention et la façon de réserver.',
  },
  {
    title: 'Conciergeries',
    body: 'Expliquez votre accompagnement, qualifiez les demandes et rassurez avant le premier échange.',
  },
] as const;

export const method = [
  { number: '01', title: 'Comprendre', body: 'Nous partons de votre activité, de vos clients et de vos priorités.' },
  { number: '02', title: 'Construire', body: 'Nous concevons le site et le parcours adapté à votre fonctionnement.' },
  { number: '03', title: 'Faire évoluer', body: 'Nous améliorons ce qui freine encore les demandes et les prises de contact.' },
] as const;

export const featuredCase = {
  client: swCarCleaning.client,
  sector: swCarCleaning.sector,
  summary: swCarCleaning.summary,
  logo: swCarCleaning.logo,
  preview: swCarCleaning.gallery[0],
  objectives: objectives.slice(0, 3),
} as const;
