/**
 * Symbole Qualifyr — la marque du bouton central de la barre mobile.
 *
 * **Ce n'est pas le mot-symbole du site.** Celui-ci (`components/ui/Logo.tsx`)
 * écrit « QUALIFYR » en toutes lettres sur un rapport de 4,5 pour 1 : réduit au
 * diamètre d'un bouton de barre d'onglets, il ne serait plus qu'une tache. Il
 * fallait donc un signe, pas un mot.
 *
 * **Ce que le signe raconte.** Un Q dont la queue est une coche. Le Q rattache
 * le bouton au mot-symbole ; la coche dit ce que fait le produit — une demande
 * entre, elle ressort qualifiée. Les deux idées tiennent en deux traits, sans
 * qu'aucun élément ne soit décoratif.
 *
 * **Première version écartée : un anneau avec une queue posée à l'extérieur,
 * en bas à droite, et une coche à l'intérieur.** Rendue à taille réelle, elle
 * ne se lisait plus comme un Q mais comme une loupe — exactement l'icône déjà
 * portée par l'onglet « Prospect », deux emplacements plus loin dans la même
 * barre. Faire partir la queue de l'intérieur de l'anneau, qu'elle traverse,
 * suffit à rétablir la lecture : c'est le trait qui coupe l'anneau qui fait le
 * Q, pas la queue elle-même.
 *
 * **Deux couleurs, et deux seulement.** Le Q en blanc porte la forme, la coche
 * en céladon (`--accent-2`, le vert de la charte) porte le sens. Aucune teinte
 * chaude : le bouton se détache d'un fond presque noir sans jamais virer au
 * doré, ce que la charte du produit exclut.
 *
 * **Dessiné pour 26 px.** Les épaisseurs (2 et 2,2) valent pour cette taille :
 * plus fines, elles disparaîtraient sur un téléphone en plein soleil ; plus
 * épaisses, la coche empâterait l'anneau au lieu de le traverser.
 */
/*
 * `string | undefined` explicite, et non `className?: string` : le projet
 * active `exactOptionalPropertyTypes`, sous lequel une propriété optionnelle
 * n'accepte pas pour autant la valeur `undefined`. Or les classes issues d'un
 * module CSS sont typées `string | undefined` — `styles.navFabMark` ne
 * passerait pas.
 */
export function QualifyrMark({ className }: { readonly className?: string | undefined }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Le Q. */}
      <circle cx="11" cy="11" r="7" stroke="#ffffff" strokeWidth="2" />
      {/* Sa queue, qui est une coche : elle démarre à l'intérieur de l'anneau
          et le traverse — c'est ce croisement qui fait lire un Q plutôt qu'une
          loupe. */}
      <path d="M14.6 14.2 17.4 17.6 21.4 12.2" stroke="#b8dcd0" strokeWidth="2.2" />
    </svg>
  );
}
