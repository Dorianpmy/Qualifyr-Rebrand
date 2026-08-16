/**
 * Halos d'ambiance — le rappel de couleur en arrière-plan.
 *
 * **Ce qu'il manquait.** La charte n'exprimait la couleur que sur des filets
 * d'un pixel. C'est juste, mais insuffisant : entre deux contours, l'œil
 * traverse des écrans entièrement gris et la marque disparaît. La référence
 * pose deux taches colorées très diffuses derrière son hero et son dernier
 * appel à l'action — on ne les remarque pas consciemment, et pourtant la page
 * cesse d'être noire.
 *
 * **Très diffus, très faible, et seulement à deux ou trois endroits.** Une
 * tache par section reviendrait à peindre le fond, et les contours cesseraient
 * de se voir. Ces halos marquent l'entrée et la sortie de la page : le premier
 * écran et le dernier, ceux qu'on retient.
 *
 * **Ils ne coûtent aucun élément interactif.** `pointer-events-none` est
 * indispensable : une tache floue plein cadre intercepterait tous les clics du
 * hero, y compris ceux du bouton principal.
 *
 * **`-z-10` et non `z-0`.** Le contenu de la section n'a pas de `z-index`
 * déclaré ; sans valeur négative, le halo passerait par-dessus le texte.
 */

export function AmbientGlow({
  position = 'top',
  intensity = 'normal',
}: {
  /** Où poser les taches. `top` pour un hero, `bottom` pour une clôture. */
  readonly position?: 'top' | 'bottom' | 'center';
  /** `soft` pour une section de milieu de page, qui ne doit pas concurrencer. */
  readonly intensity?: 'normal' | 'soft';
}) {
  const opacity = intensity === 'soft' ? 0.1 : 0.17;

  const vertical =
    position === 'top' ? '-18%' : position === 'bottom' ? 'auto' : '15%';
  const verticalEnd = position === 'bottom' ? '-22%' : 'auto';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Sable à gauche, céladon à droite. L'ordre est constant sur toute la
          page : deux halos qui échangent leur place d'une section à l'autre
          donnent l'impression d'un fond qui bouge sans raison. */}
      <div
        className="absolute left-[-10%] size-[38rem] rounded-full blur-[120px]"
        style={{
          top: vertical,
          bottom: verticalEnd,
          background: 'var(--accent-1)',
          opacity,
        }}
      />
      <div
        className="absolute right-[-12%] size-[34rem] rounded-full blur-[130px]"
        style={{
          top: position === 'top' ? '4%' : vertical,
          bottom: verticalEnd,
          background: 'var(--accent-2)',
          opacity: opacity * 0.85,
        }}
      />
    </div>
  );
}
