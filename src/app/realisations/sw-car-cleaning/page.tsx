import { redirect } from 'next/navigation';

/**
 * Étude de cas retirée à la demande de Dorian.
 *
 * Le fichier ne peut pas être supprimé du disque depuis cet environnement
 * (restriction du bac à sable) — cette page redirige donc vers la liste des
 * réalisations plutôt que d'afficher le contenu SW Carcleaning. Le contenu
 * source (`src/content/sw-car-cleaning.ts`) et ce fichier restent sur le
 * disque, orphelins : à supprimer manuellement quand c'est possible.
 *
 * La redirection au niveau de `next.config.ts` couvre déjà les liens externes
 * / indexés (redirection 301, meilleure pour le référencement) ; celle-ci est
 * une deuxième barrière si la page est atteinte directement sans passer par
 * le réseau (navigation interne Next.js, cache).
 */
export default function SwCarCleaningCaseStudyPage() {
  redirect('/realisations');
}
