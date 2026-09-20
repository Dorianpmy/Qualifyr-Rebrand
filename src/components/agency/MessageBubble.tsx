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
 * **Deux éléments imbriqués, et c'est tout l'intérêt du composant : le carré
 * noir de Safari iOS.**
 *
 * Signalé trois fois par Dorian (18/09, 20/09 deux fois, captures à l'appui) :
 * sur Safari iOS, un rectangle noir plein s'affiche derrière chaque bulle —
 * jamais reproduit sur Chromium. Deux correctifs ont échoué avant de
 * comprendre la cause :
 *
 * 1. 18/09 — `box-shadow` remplacé par `filter: drop-shadow(...)`. Récidive.
 * 2. 20/09 — ombre retirée entièrement. Récidive **alors que le correctif
 *    était bien en ligne** : vérifié sur qualifyragence.com, les bulles
 *    calculaient `filter: none` et `box-shadow: none`, et le rectangle était
 *    toujours là. L'ombre n'a donc jamais été la cause.
 *
 * **La vraie cause.** Le rectangle est peint dans le noir du document, pas
 * dans le bleu de la bulle : ce n'est pas une ombre qui déborde, c'est le fond
 * opaque d'un calque de composition. WebKit promeut l'élément sur son propre
 * calque — un `transform` non nul y suffit, et il y en a deux ici, la rotation
 * posée en ligne et celle qu'anime `.bubble-impact` — puis remplit le calque
 * avec un fond opaque **sans lui appliquer le `border-radius`**. D'où un
 * rectangle là où on attend une pilule. Tant que le même élément porte à la
 * fois la transformation et la peinture (fond + rayon), n'importe quelle
 * variante d'ombre laisse le bug intact.
 *
 * **Le correctif est structurel.** L'élément externe porte le placement, la
 * rotation et l'animation, et rien à peindre : pas de fond, pas de rayon.
 * L'élément interne porte le fond, le rayon et le texte, et aucune
 * transformation. Le calque promu est donc transparent — il n'y a plus de fond
 * opaque à remplir — et la pilule est peinte normalement à l'intérieur.
 *
 * Aucune ombre n'est rétablie au passage : elle était teintée de bleu, ce que
 * `docs/03-direction-artistique.md` interdit (ombres colorées), et le composant
 * s'en passe très bien.
 *
 * **La rotation passe par `--bubble-rotate`** plutôt que par un `transform` en
 * ligne, pour que les images clés de `.bubble-impact` puissent la reprendre.
 * Sans ça, l'animation écrase la rotation pendant 520 ms puis la bulle y
 * revient d'un coup à la fin — un ressaut visible que personne n'avait demandé.
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
  /**
   * Inclinaison de la bulle, par exemple `'-5deg'`.
   *
   * Posée en variable CSS (`--bubble-rotate`) et non en `transform` en ligne :
   * les images clés de `.bubble-impact` la relisent, donc l'inclinaison est
   * conservée pendant toute l'animation au lieu d'être écrasée puis rétablie
   * d'un coup à la fin.
   */
  readonly rotate?: string;
};

/** Écart entre deux arrivées, en millisecondes. */
const IMPACT_STAGGER = 140;

export function MessageBubble({
  text,
  style,
  compact = false,
  position = 'absolute',
  order,
  rotate,
}: MessageBubbleProps) {
  const animated = typeof order === 'number';

  return (
    /* Élément externe : placement, rotation, animation. Rien à peindre — c'est
       la condition pour que le calque promu par WebKit reste transparent (voir
       l'en-tête du fichier). */
    <span
      className={`${position === 'absolute' ? 'absolute' : 'inline-block'} ${
        animated ? 'bubble-impact' : ''
      }`}
      style={{
        ...style,
        ...(rotate
          ? { ['--bubble-rotate' as string]: rotate, transform: `rotate(${rotate})` }
          : {}),
        /* Le délai passe par une variable CSS plutôt que par
           `animationDelay` : la règle `.bubble-impact` doit pouvoir redéfinir
           toute l'animation sous `prefers-reduced-motion`, ce qu'un
           `animationDelay` en ligne empêcherait — un style en ligne bat
           toujours une feuille non `!important`. */
        ...(animated ? { ['--bubble-delay' as string]: `${order * IMPACT_STAGGER}ms` } : {}),
      }}
    >
      {/* Élément interne : fond, rayon, texte. Aucune transformation, donc
          aucune promotion de calque, donc pas de rectangle opaque. */}
      <span
        className={`block font-medium leading-[1.35] ${
          compact
            ? 'max-w-[8.5rem] px-3 py-1.5 text-[0.75rem] sm:max-w-[9.5rem] sm:px-3.5 sm:py-2 sm:text-[0.8125rem]'
            : 'max-w-[9.5rem] px-3.5 py-2 text-[0.8125rem] sm:max-w-[11rem] sm:px-4 sm:py-2.5 sm:text-[0.875rem]'
        }`}
        style={{
          borderRadius: '9999px',
          background: '#1683F8',
          color: '#FFFFFF',
        }}
      >
        {text}
      </span>
    </span>
  );
}
