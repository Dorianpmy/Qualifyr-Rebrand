'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { agencyChannels } from '@/content/agency-channels';
import { availableChannels, contact, serviceAreas } from '@/content/contact';
import {
  footerCompanyNav,
  footerServiceNav,
  legalNav,
} from '@/content/navigation';
import { BrandIcon } from '@/components/ui/BrandIcon';
import { Logo } from '@/components/ui/Logo';
import { Container } from './Container';
import styles from './Footer.module.css';

/*
 * Le bandeau « Savoir ce qui freine vos demandes » (avec bouton « Faire le
 * diagnostic ») vivait ici, affiché sur presque toutes les pages. Retiré
 * avec la suppression de la page /diagnostic — pas repointé vers /contact,
 * retiré entièrement à la demande explicite du propriétaire du site.
 */

export function Footer() {
  const pathname = usePathname();
  const year = new Date().getFullYear();
  const channels = availableChannels();

  if (
    pathname.startsWith('/app') ||
    pathname.startsWith('/reservation') ||
    pathname.startsWith('/embed') ||
    pathname.startsWith('/vitrine') ||
    pathname.startsWith('/plan')
  ) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.grid}>
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.logoLink} aria-label="Qualifyr — Accueil">
              <Logo />
            </Link>
            <p className={styles.positioning}>
              Nous concevons les sites et les outils d’acquisition des professionnels du nettoyage
              automobile mobile et du detailing à domicile.
            </p>
            {contact.social.length > 0 ? (
              <ul className={styles.socials} aria-label="Réseaux sociaux">
                {contact.social.map((network) => (
                  <li key={network.href}>
                    <a
                      href={network.href}
                      className={styles.socialLink}
                      data-network={network.icon}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Suivre Qualifyr sur ${network.label}`}
                    >
                      <BrandIcon name={network.icon} className={styles.socialIcon} />
                      <span>{network.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav aria-label="Services">
            <h2 className={styles.columnTitle}>Services</h2>
            <ul className={styles.list}>
              {footerServiceNav.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Entreprise">
            <h2 className={styles.columnTitle}>Entreprise</h2>
            <ul className={styles.list}>
              {footerCompanyNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.contactColumn}>
            <h2 className={styles.columnTitle}>Coordonnées</h2>
            {channels.length > 0 || agencyChannels.bookingUrl || contact.hours ? (
              <ul className={styles.list}>
                {channels.map((channel) => (
                  <li key={channel.href}>
                    <a href={channel.href} className={styles.link}>
                      {channel.value}
                    </a>
                  </li>
                ))}
                {agencyChannels.bookingUrl ? (
                  <li>
                    <a
                      href={agencyChannels.bookingUrl}
                      className={styles.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Réserver une analyse de parcours
                    </a>
                  </li>
                ) : null}
                {contact.hours ? <li className={styles.detail}>{contact.hours}</li> : null}
              </ul>
            ) : null}

            <p className={styles.areaLabel}>Zone d’accompagnement</p>
            <ul className={styles.areaList}>
              {serviceAreas.map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.baseline}>
          <p>© {year} Qualifyr. Tous droits réservés.</p>
          <nav aria-label="Informations légales">
            <ul className={styles.legalList}>
              {legalNav.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <Link href={item.href} className={styles.legalLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
