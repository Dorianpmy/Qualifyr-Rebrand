import Image from 'next/image';
import type { GalleryItem } from '@/content/sw-car-cleaning';
import styles from './CaseGallery.module.css';

type CaseGalleryProps = {
  items: readonly GalleryItem[];
  /** Charge le premier visuel en priorité. Réservé au visuel principal. */
  priorityFirst?: boolean;
  className?: string | undefined;
};

/**
 * Galerie d'une étude de cas.
 *
 * **Rend `null` si `items` est vide** : la section disparaît entièrement plutôt
 * que d'afficher un cadre vide ou une mention « image à venir ». Ajouter une
 * entrée dans `src/content/sw-car-cleaning.ts` suffit à la faire apparaître.
 *
 * Alternance bureau (16/10, pleine largeur) et téléphone (9/16, en regard du
 * texte, décalé une fois sur deux). Aucun carrousel : tout est atteignable en
 * défilant, au clavier comme au doigt.
 *
 * Performance : `width` et `height` déclarés — aucun décalage de mise en page ;
 * AVIF puis WebP via `next/image` ; `sizes` adapté au format ; `loading="lazy"`
 * partout sauf, éventuellement, sur le premier visuel ; `alt` obligatoire et
 * typé, donc une image sans texte alternatif fait échouer le build.
 */
export function CaseGallery({ items, priorityFirst = false, className }: CaseGalleryProps) {
  if (items.length === 0) return null;

  return (
    <div className={className ? `${styles.gallery} ${className}` : styles.gallery}>
      {items.map((item, index) => {
        const isMobile = item.device === 'mobile';
        const itemClasses = [
          styles.item,
          isMobile ? styles.mobile : null,
          isMobile && index % 2 === 1 ? styles.offset : null,
        ]
          .filter(Boolean)
          .join(' ');

        const priority = priorityFirst && index === 0;

        return (
          <figure key={item.src} className={itemClasses}>
            <div
              className={`${styles.frame} ${isMobile ? styles.mobileFrame : styles.desktopFrame}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                priority={priority}
                loading={priority ? 'eager' : 'lazy'}
                sizes={
                  isMobile
                    ? '(min-width: 62rem) 22rem, 100vw'
                    : '(min-width: 78.75rem) 1260px, 100vw'
                }
                className={styles.image}
              />
            </div>
            <figcaption className={styles.caption}>
              <span className={styles.captionMark}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{item.caption}</span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
