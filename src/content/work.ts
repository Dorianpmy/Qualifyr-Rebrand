import type { Route } from '@/types';
import { deliverables, swCarCleaning } from './sw-car-cleaning';

/**
 * Réalisations.
 *
 * Une seule entrée tant qu'il n'y en a qu'une. Aucun projet fictif, aucun
 * « concept », aucune maquette présentée comme un client, aucun résultat
 * chiffré (AGENTS.md, §6).
 *
 * Les données de SW Carcleaning viennent de `sw-car-cleaning.ts` : source
 * unique, partagée par l'accueil, la page Réalisations et l'étude de cas.
 * Pour ajouter un projet : créer son fichier de contenu, déclarer sa route
 * dans `src/types/index.ts`, puis l'ajouter au tableau ci-dessous.
 */

export type CaseSummary = {
  readonly slug: string;
  readonly client: string;
  readonly sector: string;
  readonly title: string;
  readonly summary: string;
  readonly deliverables: readonly string[];
  readonly href: Route;
  readonly logo: (typeof swCarCleaning)['logo'];
};

export const caseStudies: readonly CaseSummary[] = [
  {
    slug: 'sw-car-cleaning',
    client: swCarCleaning.client,
    sector: swCarCleaning.sector,
    title: 'Présenter clairement un lavage automobile à domicile',
    summary: swCarCleaning.summary,
    deliverables: deliverables.map((item) => item.title),
    href: '/realisations/sw-car-cleaning',
    logo: swCarCleaning.logo,
  },
];

export const workPage = {
  eyebrow: 'Réalisations',
  title: 'Des projets construits autour d’une activité réelle.',
  lead: 'Chaque projet part d’une entreprise qui existe, avec ses prestations, sa zone et ses contraintes. Nous ne présentons pas de projets imaginaires.',
} as const;
