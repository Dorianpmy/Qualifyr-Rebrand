import styles from './InteractiveSitePreview.module.css';

type InteractiveSitePreviewProps = {
  url: string;
  title: string;
  domain: string;
  caption?: string;
  compact?: boolean;
};

export function InteractiveSitePreview({
  url,
  title,
  domain,
  caption = 'Site réel · navigation interactive',
  compact = false,
}: InteractiveSitePreviewProps) {
  return (
    <figure className={`${styles.preview} ${compact ? styles.compact : ''}`}>
      <div className={styles.viewport}>
        <iframe
          src={url}
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
        />
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
