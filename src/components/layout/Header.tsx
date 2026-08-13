'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { primaryNav } from '@/content/navigation';
import { BookingDialog } from '@/components/agency/BookingDialog';
import { ConversionPrompt } from '@/components/agency/ConversionPrompt';
import { WhatsAppDirectButton } from '@/components/agency/WhatsAppDirectButton';
import { Logo } from '@/components/ui/Logo';
import { Container } from './Container';
import { MobileNavigation } from './MobileNavigation';
import styles from './Header.module.css';

function isSaaSPath(pathname: string) {
  return pathname.startsWith('/app') || pathname.startsWith('/reservation');
}

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const isDiagnostic = pathname === '/diagnostic';

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isSaaSPath(pathname)) return null;

  if (isDiagnostic) {
    return (
      <>
        <header className={`${styles.header} ${styles.diagnosticHeader}`}>
          <Container>
            <div className={styles.diagnosticInner}>
              <Link href="/" className={styles.brand} aria-label="Qualifyr Agence, accueil">
                <Logo />
              </Link>
              <Link href="/" className={styles.diagnosticBack}>
                <span aria-hidden="true">←</span>
                Retour au site
              </Link>
            </div>
          </Container>
        </header>
        <BookingDialog />
      </>
    );
  }

  return (
    <>
      <header className={isScrolled ? `${styles.header} ${styles.scrolled}` : styles.header}>
        <Container>
          <div className={styles.inner}>
            <Link href="/" className={styles.brand} aria-label="Qualifyr Agence, accueil">
              <Logo />
            </Link>

            <nav className={styles.nav} aria-label="Navigation principale">
              <ul className={styles.navList}>
                {primaryNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={styles.navLink}
                      {...(pathname === item.href ? { 'aria-current': 'page' as const } : {})}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className={styles.actions}>
              <div className={styles.cta}>
                <WhatsAppDirectButton ctaId="header_whatsapp" variant="secondary" className={styles.whatsappCta!}>
                  Discuter sur WhatsApp
                </WhatsAppDirectButton>
              </div>
              <MobileNavigation pathname={pathname} />
            </div>
          </div>
        </Container>
      </header>
      {pathname === '/' ? (
        <div className={styles.editorialBar} aria-label="Informations Qualifyr">
          <Container>
            <div className={styles.editorialInner}>
              <p>01 — Qualifyr Agence</p>
              <p>Entreprises de services</p>
              <p>Identité · Site · Parcours</p>
            </div>
          </Container>
        </div>
      ) : null}
      <BookingDialog />
      <ConversionPrompt />
    </>
  );
}
