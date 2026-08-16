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
import { ButtonLink } from '@/components/ui/Button';
import { BrandIcon } from '@/components/ui/BrandIcon';
import { Logo } from '@/components/ui/Logo';
import { Container } from './Container';
import styles from './Footer.module.css';

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
  if (pathname === '/diagnostic') return null;

  // La verticale conciergerie et son simulateur ont été retirés du site
  // (commit `7b89646`) : ces routes ne correspondent plus à rien.
  const hasPageSpecificCta = pathname === '/nettoyage-automobile' || pathname === '/tarifs';

  return (
    <footer className={styles.footer}>
      <Container>
        {pathname === '/' || hasPageSpecificCta ? null : (
          <section className={styles.cta} data-surface="inverse" aria-labelledby="footer-cta-title">
            <div className={styles.ctaCopy}>
              <p className={styles.ctaEyebrow}>Votre prochaine étape</p>
              <h2 id="footer-cta-title" className={styles.ctaTitle}>
                Savoir ce qui freine vos demandes.
              </h2>
              <p className={styles.ctaText}>
                Le diagnostic prend trois minutes. Il identifie ce qui bloque aujourd’hui et ce qu’il
                faut corriger en premier — avant même de parler de budget.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <ButtonLink href="/diagnostic" ctaId="final_diagnostic" variant="inverse" withArrow>
                Faire le diagnostic
              </ButtonLink>
              <ButtonLink href="/tarifs" ctaId="footer_pricing" variant="inverseSecondary">
                Voir les tarifs
              </ButtonLink>
            </div>
          </section>
        )}

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
