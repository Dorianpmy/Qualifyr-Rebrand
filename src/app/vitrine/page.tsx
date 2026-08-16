import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

/**
 * `/vitrine` était l'adresse de travail de la refonte, le temps de la valider
 * sans toucher à la page d'accueil en ligne. La refonte est maintenant servie
 * sur `/`.
 *
 * **Redirection plutôt que suppression.** L'adresse a circulé pendant la
 * validation — dans nos échanges, et peut-être dans un onglet resté ouvert ou
 * un signet. Une page supprimée renverrait une erreur 404 ; la redirection
 * amène au bon endroit.
 *
 * **Permanente, et non temporaire.** Elle indique aux moteurs que l'adresse ne
 * reviendra pas, ce qui évite qu'ils continuent de la visiter. Les deux URL
 * servant la même page se seraient de toute façon concurrencées dans les
 * résultats de recherche.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function VitrineRedirect(): never {
  permanentRedirect('/');
}
