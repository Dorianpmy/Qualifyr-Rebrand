import type { CSSProperties } from 'react';

/**
 * Bulle de message bleue réutilisable.
 *
 * **Fond/couleur/ombre en `style`, jamais en classe utilitaire seule.** Une
 * classe de fond (`bg-*`) ou de texte (`text-*`) a déjà cessé de s'appliquer
 * silencieusement ailleurs dans ce projet en production (voir `RowItem` dans
 * `BeforeAfterSection.tsx`, ou `CompareSection.tsx`) — jamais avec une cause
 * unique identifiée, toujours corrigé de la même façon : une valeur écrite en
 * dur ne laisse plus cette possibilité. Seules les propriétés qui ont
 * réellement besoin d'un point de rupture (taille, police, marges) restent en
 * classes Tailwind responsives ; aucune règle globale du projet ne cible
 * spécifiquement une classe de taille de texte, donc aucun risque identique
 * ici.
 *
 * **Pourquoi bleu et pas gris, cette fois.** Une version précédente de ces
 * bulles (dans `BeforeAfterSection`) était passée au gris neutre après un
 * bug où le texte se lisait orange en production — mais ce bug venait d'une
 * classe de couleur de texte posée à côté d'un fond en `style` (perte de
 * classe en cascade), pas du bleu en tant que tel. Ici la couleur du texte
 * est elle aussi posée en `style`, pas en classe : le même risque ne
 * s'applique pas.
 *
 * **Aucune ombre sur cet élément — ni `box-shadow`, ni `filter`.**
 * Signalé par Dorian (18/09/2026, capture d'écran) : sur Safari iOS, un
 * carré noir plein s'affichait derrière chaque groupe de bulles — jamais
 * reproduit sur Chromium. Premier correctif (18/09) : remplacer le
 * `box-shadow` par un `filter: drop-shadow(...)` visuellement identique,
 * supposé composer correctement avec le `transform` que `.bubble-impact`
 * anime (voir `tailwind.css`). Insuffisant : Dorian revoit exactement le
 * même carré noir le 20/09, sur le même appareil — `filter` promeut lui
 * aussi l'élément sur son propre calque, donc le même bug WebKit
 * (calque + `transform` animé + effet peint en rectangle opaque) s'applique
 * tout autant à `drop-shadow` qu'à `box-shadow`.
 *
 * Plutôt que de retenter une troisième variante CSS invérifiable dans ce
 * projet (aucun accès à un Safari iOS réel ici, seulement Chromium), l'ombre
 * est retirée : plus d'ombre, plus de calque forcé par un effet de peinture,
 * plus de bug possible. C'était de toute façon une ombre teintée de bleu
 * (`rgba(22, 131, 248, …)`), or `docs/03-direction-artistique.md` interdit
 * les ombres colorées — cette suppression aligne aussi le composant sur la
 * charte plutôt que de créer une exception qui n'a jamais été documentée.
 */
type MessageBubbleProps = {
  readonly text: string;
  readonly style?: CSSProperties;
  /** Bulle plus petite et plus discrète (utilisée pour les messages
   *  d'arrière-plan d'un nuage dispersé) — reste en bleu plein, jamais
   *  délavée : seule la taille change, jamais la couleur ni l'opacité. */
  readonly compact?: boolean;
  /**
   * `'absolute'` (défaut) pour un nuage dispersé positionné via `style`.
   * `'static'` pour une rangée en flux normal (utilisé sur mobile dans
   * `DarkHero` : une position en pourcentage a du sens sur un nuage large,
   * pas sur une colonne étroite où elle ferait sortir la bulle de l'écran —
   * `flex-wrap` en flux normal ne déborde jamais, quelle que soit la
   * largeur).
   */
  readonly position?: 'absolute' | 'static';
  /**
   * Rang d'arrivée dans le fil, à partir de 0.
   *
   * Déclenche l'animation « impact » (voir `.bubble-impact` dans
   * `tailwind.css`) et décale son départ : les messages se posent l'un après
   * l'autre, comme dans une conversation. Sans cette valeur, aucune animation
   * — la bulle reste utilisable telle quelle ailleurs sur le site.
   */
  readonly order?: number;
};

/** Écart entre deux arrivées, en millisecondes. */
const IMPACT_STAGGER = 140;

export function MessageBubble({
  text,
  style,
  compact = false,
  position = 'absolute',
  order,
}: MessageBubbleProps) {
  const animated = typeof order === 'number';

  return (
    <span
      className={`${position === 'absolute' ? 'absolute' : 'relative'} ${
        animated ? 'bubble-impact' : ''
      } font-medium leading-[1.35] ${
        compact
          ? 'max-w-[8.5rem] px-3 py-1.5 text-[0.75rem] sm:max-w-[9.5rem] sm:px-3.5 sm:py-2 sm:text-[0.8125rem]'
          : 'max-w-[9.5rem] px-3.5 py-2 text-[0.8125rem] sm:max-w-[11rem] sm:px-4 sm:py-2.5 sm:text-[0.875rem]'
      }`}
      style={{
        ...style,
        borderRadius: '9999px',
        background: '#1683F8',
        color: '#FFFFFF',
        /* Le délai passe par une variable CSS plutôt que par
           `animationDelay` : la règle `.bubble-impact` doit pouvoir redéfinir
           toute l'animation sous `prefers-reduced-motion`, ce qu'un
           `animationDelay` en ligne empêcherait — un style en ligne bat
           toujours une feuille non `!important`. */
        ...(animated ? { ['--bubble-delay' as string]: `${order * IMPACT_STAGGER}ms` } : {}),
      }}
    >
      {text}
    </span>
  );
}
