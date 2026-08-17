import type { CaseImage } from './sw-car-cleaning';
import type { Route } from '@/types';

/**
 * Réalisations.
 *
 * Aucun projet fictif, aucun « concept », aucune maquette présentée comme un
 * client, aucun résultat chiffré (AGENTS.md, §6).
 *
 * Tableau vide pour l'instant — l'étude de cas SW Carcleaning a été retirée
 * à la demande de Dorian. Pour ajouter un projet : créer son fichier de
 * contenu, déclarer sa route dans `src/types/index.ts`, puis l'ajouter au
 * tableau ci-dessous. `src/app/realisations/page.tsx` gère déjà un tableau
 * vide sans avoir besoin d'un état de repli particulier.
 */

export type CaseSummary = {
  readonly slug: string;
  readonly client: string;
  readonly sector: string;
  readonly title: string;
  readonly summary: string;
  readonly deliverables: readonly string[];
  readonly href: Route;
  readonly logo: CaseImage | null;
};

export const caseStudies: readonly CaseSummary[] = [];

export const workPage = {
  eyebrow: 'Réalisations',
  title: 'Des projets construits autour d’une activité réelle.',
  lead: 'Chaque projet part d’une entreprise qui existe, avec ses prestations, sa zone et ses contraintes. Nous ne présentons pas de projets imaginaires.',
} as const;
