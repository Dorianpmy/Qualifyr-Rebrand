import type { ReactNode } from 'react';
import styles from './QuoteBlock.module.css';

type QuoteBlockProps = {
  children: ReactNode;
  /**
   * Attribution. **À ne renseigner que pour une citation réelle, prononcée par
   * une personne identifiée, avec son autorisation écrite.**
   */
  attribution?: {
    readonly name: string;
    readonly role?: string;
  };
  centered?: boolean;
  inverse?: boolean;
  className?: string | undefined;
};

/**
 * Phrase manifeste en grande typographie.
 *
 * Usage par défaut : **sans attribution**. C'est un bloc de position, pas un
 * témoignage. Qualifyr n'a aucun témoignage recueilli et validé : en produire
 * un ici, même vraisemblable, est interdit (AGENTS.md, §6).
 *
 * `attribution` n'existe que pour le jour où une citation réelle et autorisée
 * sera disponible. Tant que ce n'est pas le cas, la prop reste inutilisée.
 */
export function QuoteBlock({
  children,
  attribution,
  centered = false,
  inverse = false,
  className,
}: QuoteBlockProps) {
  const classes = [
    styles.quote,
    centered ? styles.centered : null,
    inverse ? styles.inverse : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <figure className={classes}>
      <span className={styles.rule} aria-hidden="true" />
      <blockquote className={styles.text}>{children}</blockquote>
      {attribution ? (
        <figcaption className={styles.attribution}>
          <span className={styles.name}>{attribution.name}</span>
          {attribution.role ? <span>{attribution.role}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
