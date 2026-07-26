import styles from './SkipLink.module.css';

export function SkipLink() {
  return (
    <a href="#contenu" className={styles.skip}>
      Aller au contenu
    </a>
  );
}
