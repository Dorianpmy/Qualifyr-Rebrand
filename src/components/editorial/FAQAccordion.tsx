import type { FaqItem } from '@/content/faq';
import { Icon } from '@/components/ui/Icon';
import styles from './FAQAccordion.module.css';

type FAQAccordionProps = {
  items: readonly FaqItem[];
  /** Index de la question ouverte au chargement. Aucune par défaut. */
  defaultOpen?: number;
  className?: string | undefined;
};

/**
 * Questions fréquentes.
 *
 * Construit sur `<details>` / `<summary>` : le pliage est natif, donc
 * accessible au clavier, restitué correctement par les lecteurs d'écran, et
 * fonctionnel même sans JavaScript. Aucun état React, aucun ARIA manuel,
 * aucune dépendance.
 *
 * Ne pas s'en servir pour masquer un contenu faible : chaque réponse doit tenir
 * seule et dire quelque chose de vrai.
 */
export function FAQAccordion({ items, defaultOpen, className }: FAQAccordionProps) {
  return (
    <div className={className ? `${styles.list} ${className}` : styles.list}>
      {items.map((item, index) => (
        <details
          key={item.question}
          className={styles.item}
          {...(defaultOpen === index ? { open: true } : {})}
        >
          <summary className={styles.summary}>
            <span>{item.question}</span>
            <Icon name="plus" size={0.8} className={styles.indicator} />
          </summary>
          <div className={styles.answer}>
            <p>{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
