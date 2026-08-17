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
 */
type MessageBubbleProps = {
  readonly text: string;
  readonly style?: CSSProperties;
  /** Bulle plus petite et plus discrète (utilisée pour les messages
   *  d'arrière-plan d'un nuage dispersé) — reste en bleu plein, jamais
   *  délavée : seule la taille change, jamais la couleur ni l'opacité. */
  readonly compact?: boolean;
};

export function MessageBubble({ text, style, compact = false }: MessageBubbleProps) {
  return (
    <span
      className={`absolute font-medium leading-[1.35] ${
        compact
          ? 'max-w-[8.5rem] px-3 py-1.5 text-[0.75rem] sm:max-w-[9.5rem] sm:px-3.5 sm:py-2 sm:text-[0.8125rem]'
          : 'max-w-[9.5rem] px-3.5 py-2 text-[0.8125rem] sm:max-w-[11rem] sm:px-4 sm:py-2.5 sm:text-[0.875rem]'
      }`}
      style={{
        ...style,
        borderRadius: '9999px',
        background: '#1683F8',
        color: '#FFFFFF',
        boxShadow: '0 4px 14px rgba(22, 131, 248, 0.22)',
      }}
    >
      {text}
    </span>
  );
}
