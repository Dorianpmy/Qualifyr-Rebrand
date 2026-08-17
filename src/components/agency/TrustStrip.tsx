/**
 * Bandeau de réassurance — ce que le produit fait, à la place d'un compteur.
 *
 * **Pourquoi pas d'avatars ni de décompte.** Quatre visages sous « +100
 * utilisateurs » n'est pas un décor, c'est une affirmation : le visiteur
 * comprend « voici des gens qui l'utilisent ». Tant que le chiffre n'est pas
 * vérifiable, la phrase est fausse et les visages servent à la rendre
 * crédible — jusqu'au premier prospect qui demande une référence.
 *
 * Ces trois promesses-là sont vraies aujourd'hui, et elles occupent la même
 * place : celle où l'œil cherche une raison de croire, juste sous le bouton.
 *
 * Le jour où de vrais clients existent, `SocialProof` reprend cette place avec
 * leurs visages et leur nombre exact. Dix vrais convainquent plus que cent
 * invérifiables.
 */

const points = [
  { label: 'Prix ferme', detail: 'affiché en trois minutes' },
  { label: 'Acompte encaissé', detail: 'avant le rendez-vous' },
  { label: 'France et Suisse', detail: 'euro ou franc' },
] as const;

export function TrustStrip() {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
      {points.map((point, index) => (
        <li key={point.label} className="flex items-center gap-8">
          {/* Séparateur porté par l'élément suivant plutôt qu'en bordure :
              une bordure resterait visible en fin de ligne après un retour. */}
          {index > 0 ? (
            <span aria-hidden="true" className="hidden h-8 w-px bg-hairline sm:block" />
          ) : null}
          <span className="flex items-center gap-2.5">
            {/* Point vert : signal « actif », pas une couleur de marque —
                voir la note dans `tailwind.css` sur `.status-dot`. */}
            <span aria-hidden="true" className="status-dot" />
            <span className="text-center sm:text-start">
              <span className="block text-[0.9375rem] font-semibold text-primary">
                {point.label}
              </span>
              <span className="block text-[0.8125rem] text-faint">{point.detail}</span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
