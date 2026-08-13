import { objectives, swCarCleaning } from './sw-car-cleaning';

/**
 * Hero — positionnement recentré nettoyage automobile / detailing.
 *
 * La restriction est l'argument : un seul métier, bien connu.
 */
export const hero = {
  eyebrow: 'Agence digitale · Nettoyage automobile & detailing',
  title: 'Des sites qui transforment vos abonnés en réservations.',
  body:
    'Instagram vous fait connaître. Un site clair présente vos formules, affiche vos tarifs et transforme une visite en demande de créneau — sans passer par vingt messages privés.',
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
    body: 'Nous structurons vos formules et vos tarifs pour que vos prospects comprennent rapidement ce que vous proposez.',
  },
  {
    number: '02',
    title: 'Un site pensé pour agir',
    body: 'Chaque page guide vers une demande de créneau ou un échange utile.',
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
] as const;

export const transformations = [
  {
    number: '01',
    title: 'Être compris',
    body: 'Une offre claire, structurée et immédiatement lisible.',
  },
  {
    number: '02',
    title: 'Être choisi',
    body: 'Une identité et un site qui inspirent confiance avant le premier échange.',
  },
  {
    number: '03',
    title: 'Être contacté',
    body: 'Un parcours simple qui guide le visiteur vers la bonne action.',
  },
] as const;

export const serviceCompanies = [
  {
    title: 'Nettoyage automobile & detailing',
    body: 'Présenter les prestations, valoriser le niveau de travail et simplifier le passage vers la prise de contact.',
    href: '/nettoyage-automobile' as const,
  },
] as const;

export const method = [
  { number: '01', title: 'Comprendre', body: 'Votre activité, vos clients, votre différence et vos objectifs.' },
  { number: '02', title: 'Clarifier', body: 'L’offre, le message, la hiérarchie et les actions attendues.' },
  { number: '03', title: 'Concevoir', body: 'L’identité, les contenus, le site et le parcours de contact.' },
  { number: '04', title: 'Améliorer', body: 'Les détails, la lisibilité, l’expérience mobile et les points de friction.' },
] as const;

export const featuredCase = {
  client: swCarCleaning.client,
  sector: swCarCleaning.sector,
  summary: swCarCleaning.summary,
  logo: swCarCleaning.logo,
  preview: swCarCleaning.gallery[0],
  objectives: objectives.slice(0, 3),
} as const;
