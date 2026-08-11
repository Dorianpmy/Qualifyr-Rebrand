import { objectives, swCarCleaning } from './sw-car-cleaning';

/**
 * Hero — pari de la spécialité (arbitrage du 11/08/2026, cf.
 * `docs/11-refonte-copywriting.md`, §2.1 option B).
 *
 * La restriction **est** l'argument : dire non à trente métiers est la preuve
 * la plus économique qu'on connaît les deux qu'on garde. Un titre de bénéfice
 * générique — « faites de votre savoir-faire une évidence » — pouvait coiffer
 * un cabinet de conseil ou un ébéniste ; il ne disqualifiait aucun concurrent
 * généraliste et ne justifiait aucune prime de spécialiste.
 *
 * **Contrepartie assumée** : ce titre engage publiquement sur deux métiers. Le
 * jour où l'offre élargie d'`AGENTS.md` §2 devient prioritaire, c'est le titre
 * qu'il faut changer — pas l'ajuster. L'option de repli est documentée.
 */
export const hero = {
  eyebrow: 'Agence digitale · Deux métiers, pas trente',
  title: 'Nous ne faisons des sites que pour deux métiers.',
  body:
    'Le nettoyage automobile et les conciergeries de location courte durée. Assez peu pour connaître vos objections client par cœur. Assez longtemps pour savoir ce qui déclenche une demande.',
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
    href: '/nettoyage-automobile',
  },
  {
    title: 'Conciergeries',
    body: 'Clarifier l’accompagnement, inspirer confiance et guider chaque demande vers la bonne action.',
    href: '/conciergerie',
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
