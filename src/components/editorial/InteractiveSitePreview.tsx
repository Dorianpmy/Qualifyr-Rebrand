'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './InteractiveSitePreview.module.css';

type InteractiveSitePreviewProps = {
  url: string;
  title: string;
  domain: string;
  caption?: string;
  compact?: boolean;
};

/**
 * Aperçu d'un site réellement en ligne, chargé à l'approche.
 *
 * **Pourquoi un observateur et pas seulement `loading="lazy"`.** L'attribut
 * native est un conseil, pas une garantie : les navigateurs l'appliquent de
 * façon inégale aux cadres, et plusieurs déclenchent le chargement dès la
 * construction du document quand le cadre est haut dans la page. Un site
 * distant, lui, coûte une page entière — ses polices, ses images, ses scripts.
 * Sur un téléphone en réseau lent, cette page-là entre en concurrence avec la
 * nôtre au pire moment.
 *
 * Le cadre n'est donc monté qu'à l'approche du viewport, avec 400 px de marge
 * pour qu'il soit prêt avant d'être vu. Tant qu'il ne l'est pas, aucune requête
 * n'est émise. `loading="lazy"` est conservé en seconde barrière.
 *
 * Sans `IntersectionObserver` — navigateur ancien, test automatisé — on charge
 * immédiatement : mieux vaut une page lourde qu'un cadre qui n'apparaît jamais.
 */
export function InteractiveSitePreview({
  url,
  title,
  domain,
  caption = 'Site réel · navigation interactive',
  compact = false,
}: InteractiveSitePreviewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <figure className={`${styles.preview} ${compact ? styles.compact : ''}`}>
      <div className={styles.viewport} ref={viewportRef}>
        {shouldLoad ? (
          <iframe
            src={url}
            title={title}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
          />
        ) : (
          /* Réserve la place exacte du cadre : sans ce substitut, l'apparition
             du site distant décalerait le contenu qui suit. */
          <p className={styles.placeholder} aria-hidden="true">
            {domain}
          </p>
        )}
      </div>

      <figcaption>
        <span>{caption}</span>
        <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Ouvrir ${domain} dans un nouvel onglet`}>
          {domain} <span aria-hidden="true">↗</span>
        </a>
      </figcaption>
    </figure>
  );
}
