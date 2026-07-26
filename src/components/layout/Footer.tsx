import Link from 'next/link';
import { brand } from '@/content/brand';
import { availableChannels, contact } from '@/content/contact';
import { footerNav, legalNav } from '@/content/navigation';
import { Logo } from '@/components/ui/Logo';
import { Container } from './Container';
import styles from './Footer.module.css';

/**
 * Pied de page — sobre, sombre, éditorial.
 *
 * Les coordonnées viennent de `src/content/contact.ts` et **seules les valeurs
 * réellement renseignées sont affichées**. Si aucun canal n'est connu, la
 * colonne « Contact » disparaît entièrement plutôt que d'afficher un
 * placeholder ou une information inventée : ni adresse, ni téléphone, ni
 * horaires, ni réseaux sociaux.
 */
export function Footer() {
  const year = new Date().getFullYear();
  const channels = availableChannels();

  return (
    <footer className={styles.footer} data-surface="inverse">
      <Container>
        <div className={styles.grid}>
          <div>
            <Logo inverse />
            <p className={styles.positioning}>{brand.descriptor}</p>
            <p className={styles.domain}>{contact.domain}</p>
          </div>

          <nav aria-label="Pages du site">
            <h2 className={styles.columnTitle}>Le site</h2>
            <ul className={styles.list}>
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {channels.length > 0 ? (
            <div>
              <h2 className={styles.columnTitle}>Contact</h2>
              <ul className={styles.list}>
                {channels.map((channel) => (
                  <li key={channel.href}>
                    <a href={channel.href} className={styles.link}>
                      {channel.value}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <nav aria-label="Informations légales">
            <h2 className={styles.columnTitle}>Informations</h2>
            <ul className={styles.list}>
              {legalNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.baseline}>
          <p>{brand.fullName} — nettoyage automobile mobile et detailing à domicile</p>
          <p>© {year}</p>
        </div>
      </Container>
    </footer>
  );
}
