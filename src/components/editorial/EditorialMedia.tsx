import Image, { type ImageProps } from 'next/image';
import styles from './EditorialMedia.module.css';

type EditorialMediaProps = {
  src: ImageProps['src'];
  /** Texte alternatif utile. Obligatoire : aucune image de contenu sans `alt`. */
  alt: string;
  ratio?: 'portrait' | 'landscape' | 'panorama';
  /** Légende. Le repère court à gauche joue le rôle d'annotation éditoriale. */
  caption?: string;
  captionMark?: string;
  /** Image du premier écran : chargement prioritaire. */
  priority?: boolean;
  /** Léger agrandissement au survol. Désactivé si le mouvement est réduit. */
  zoom?: boolean;
  sizes?: string;
  className?: string | undefined;
};

/**
 * Image éditoriale : cadre au ratio imposé, légende optionnelle.
 *
 * Réservé à des **photographies réelles et autorisées** — travail en cours,
 * véhicules, matières, gestes. Interdit : rendus 3D, captures d'interface,
 * faux écrans d'application, banques d'images génériques (AGENTS.md, §6).
 *
 * Si aucune photo réelle n'est disponible pour une section, on retire la
 * section : on ne la remplit pas avec un visuel de substitution.
 */
export function EditorialMedia({
  src,
  alt,
  ratio = 'landscape',
  caption,
  captionMark,
  priority = false,
  zoom = false,
  sizes = '(min-width: 62rem) 50vw, 100vw',
  className,
}: EditorialMediaProps) {
  const frameClasses = [styles.frame, styles[ratio], zoom ? styles.zoom : null]
    .filter(Boolean)
    .join(' ');

  return (
    <figure className={className ? `${styles.figure} ${className}` : styles.figure}>
      <div className={frameClasses}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={styles.image}
        />
      </div>
      {caption ? (
        <figcaption className={styles.caption}>
          {captionMark ? <span className={styles.captionMark}>{captionMark}</span> : null}
          <span>{caption}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
