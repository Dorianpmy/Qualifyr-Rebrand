/**
 * Bandeau de réassurance — ce que le produit fait, à la place d'un compteur.
 *
 * **Pourquoi pas d'avatars ni de décompte.** Quatre visages sous « +100
 * utilisateurs » n'est pas un décor, c'est une affirmation : le visiteur
 * comprend « voici des gens qui l'utilisent ». Tant que le chiffre n'est pas
 * vérifiable, la phrase est fausse et les visages servent à la rendre
 * crédible — jusqu'au premier prospect qui demande une référence.
 *
 * Ces trois promesses-là occupent la même place : celle où l'œil cherche une
 * raison de croire, juste sous le bouton.
 *
 * **Contenu retravaillé le 18/08/2026** (demande « ton anti-bullshit »,
 * refonte hero). Les trois bénéfices demandés textuellement étaient
 * « Vous êtes visible / Vous publiez sans réfléchir, des idées prêtes à
 * utiliser / Vous recevez plus de demandes ». Le deuxième décrit une
 * fonctionnalité de suggestions de contenu à publier que Qualifyr n'a pas
 * (voir `services-content.tsx` : agent de prospection, réservation à prix
 * ferme, filtrage des curieux — rien sur la création de contenu) ; la
 * demande elle-même impose de reformuler honnêtement une promesse non
 * disponible plutôt que de l'utiliser telle quelle. Les deux autres sont
 * conservés dans leur esprit et ancrés sur les fonctionnalités réelles.
 *
 * Le jour où de vrais clients existent, `SocialProof` reprend cette place avec
 * leurs visages et leur nombre exact. Dix vrais convainquent plus que cent
 * invérifiables.
 */

const points = [
  {
    label: 'Vous n’avez plus à démarcher',
    detail: 'Un agent travaille votre secteur pendant que vous lavez des véhicules.',
  },
  {
    label: 'Vous arrêtez les devis du soir',
    detail: 'Le prix et la durée s’affichent à l’écran, plus besoin de les rédiger à la main.',
  },
  {
    label: 'Vous recevez plus de demandes',
    detail: 'Un parcours simple pour permettre aux clients de vous contacter.',
  },
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
              {point.detail ? (
                <span className="block text-[0.8125rem] text-faint">{point.detail}</span>
              ) : null}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
