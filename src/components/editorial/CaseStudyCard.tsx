import type { ReactNode } from 'react';
import styles from './CaseStudyCard.module.css';

type CaseStudyCardProps = {
  /** Nom réel du client, utilisé avec son autorisation. */
  client: string;
  title: string;
  summary: ReactNode;
  /** Ce qui a été mis en place. Des faits, jamais des résultats chiffrés. */
  deliverables?: readonly string[];
  media?: ReactNode;
  action?: ReactNode;
  /** Décale le texte vers le bas sur grand écran — composition de magazine. */
  offset?: boolean;
  className?: string | undefined;
};

/**
 * Présentation d'une réalisation réelle.
 *
 * Interdiction stricte : aucun résultat chiffré, aucun pourcentage, aucun
 * témoignage, aucune note. `deliverables` liste ce qui a été **fait**, pas ce
 * que cela aurait produit. SW Carcleaning peut être cité comme réalisation
 * réelle, sans aucun chiffre (AGENTS.md, §6).
 *
 * Une seule réalisation tant qu'il n'y en a qu'une : pas de grille remplie de
 * cases vides ni de « projet fictif ».
 */
export function CaseStudyCard({
  client,
  title,
  summary,
  deliverables,
  media,
  action,
  offset = false,
  className,
}: CaseStudyCardProps) {
  const classes = [styles.card, offset ? styles.offset : null, className]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={classes}>
      {media}
      <div className={styles.body}>
        <p className={styles.client}>{client}</p>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.summary}>{summary}</div>
        {deliverables && deliverables.length > 0 ? (
          <ul className={styles.deliverables}>
            {deliverables.map((item) => (
              <li key={item} className={styles.deliverable}>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
        {action ? <div className={styles.action}>{action}</div> : null}
      </div>
    </article>
  );
}
