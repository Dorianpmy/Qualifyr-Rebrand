import type { ReactNode } from 'react';
import { AmbientGlow } from './AmbientGlow';

/**
 * Conteneur de section du site vitrine.
 *
 * **Deux niveaux, pas un.** La `<section>` prend toute la largeur de la fenêtre
 * et centre son contenu ; le `<div>` intérieur porte la largeur maximale et les
 * marges latérales. Confondre les deux — mettre `max-width` sur la section
 * elle-même — laisse le fond s'arrêter au bord du texte, ce qui interdit toute
 * bande pleine largeur et fait apparaître les décalages qu'on a passé du temps
 * à traquer.
 *
 * Tout ce qui est structurel est ici. Aucune section ne redéfinit sa propre
 * largeur : c'est ce qui garantit qu'elles restent alignées entre elles.
 */

export type SectionProps = {
  readonly children: ReactNode;
  readonly id?: string;
  readonly labelledBy?: string;
  /** Classes ajoutées à la `<section>` : fond, bordures, espacement vertical. */
  readonly className?: string;
  /** Classes ajoutées au conteneur intérieur, pour élargir ou resserrer. */
  readonly innerClassName?: string;
  /**
   * Halos de couleur en arrière-plan.
   *
   * Réservé à trois sections au maximum sur toute la page — l'entrée, un
   * point de bascule, la sortie. Au-delà, la couleur cesse d'être un accent
   * et devient un fond, et les contours dégradés disparaissent avec elle.
   */
  readonly glow?: 'top' | 'bottom' | 'center';
  readonly glowIntensity?: 'normal' | 'soft';
};

export function Section({
  children,
  id,
  labelledBy,
  className = '',
  innerClassName = '',
  glow,
  glowIntensity = 'normal',
}: SectionProps) {
  return (
    <section
      id={id}
      data-theme="dark"
      aria-labelledby={labelledBy}
      /* Révélation au défilement (24/08/2026). `RevealObserver`, monté dans le
         layout, observe tout ce qui porte cet attribut ; `layout/Section` le
         posait déjà, pas celui-ci — donc l'effet existait sur les anciennes
         pages et nulle part sur les pages sombres, qui sont l'essentiel du
         site refait.
         Le masquage initial est en CSS, sous `prefers-reduced-motion:
         no-preference` : sans JavaScript, avec un script en échec, ou pour qui
         a réduit les animations, la page reste intégralement lisible. Aucun
         contenu n'attend une animation pour exister. */
      data-reveal-target
      /* `relative` et `isolate` en permanence : sans le contexte
         d'empilement, un halo de 120 px de flou déborderait sur les sections
         voisines et s'additionnerait au leur. */
      className={`relative isolate flex w-full justify-center overflow-hidden bg-ink ${className}`}
    >
      {glow ? <AmbientGlow position={glow} intensity={glowIntensity} /> : null}
      <div className={`w-full max-w-7xl px-4 md:px-8 ${innerClassName}`}>{children}</div>
    </section>
  );
}
