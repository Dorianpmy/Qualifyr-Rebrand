'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { primaryNav } from '@/content/navigation';
import { BookingDialog } from '@/components/agency/BookingDialog';
import { WhatsAppDiagnostic, WhatsAppDiagnosticButton } from '@/components/agency/WhatsAppDiagnostic';
import { Logo } from '@/components/ui/Logo';
import { Container } from './Container';
import { MobileNavigation } from './MobileNavigation';
import styles from './Header.module.css';

/**
 * En-tête collant, discret.
 *
 * Au repos il se confond avec la page ; dès que l'on défile, un filet fin
 * apparaît en bord inférieur. Le fond est un voile ivoire à 88 % — assez pour
 * laisser deviner le défilement, jamais assez pour gêner la lecture. Pas de
 * flou marqué, pas de glassmorphism, pas de mega-menu.
 */
export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
              <WhatsAppDiagnosticButton variant="secondary" className={styles.whatsappCta!}>
                Discuter sur WhatsApp
              </WhatsAppDiagnosticButton>
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
            <p>France · Belgique · Luxembourg · Suisse</p>
            <p>Nettoyage auto · Conciergeries</p>
          </div>
        </Container>
      </div>
    ) : null}
    <BookingDialog />
    <WhatsAppDiagnostic />
    </>
  );
}
