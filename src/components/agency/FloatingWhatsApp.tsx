'use client';

import { usePathname } from 'next/navigation';
import { agencyChannels } from '@/content/agency-channels';
import { BrandIcon } from '@/components/ui/BrandIcon';
import { buildDirectWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import styles from './FloatingWhatsApp.module.css';

export function FloatingWhatsApp() {
  const pathname = usePathname();
  if (pathname === '/diagnostic') return null;
  if (
    pathname.startsWith('/app') ||
    pathname.startsWith('/reservation') ||
    pathname.startsWith('/embed') ||
    pathname.startsWith('/vitrine') ||
    pathname.startsWith('/plan')
  ) {
    return null;
  }
  if (!agencyChannels.whatsappNumber) return null;

  const href = buildWhatsAppUrl(
    agencyChannels.whatsappNumber,
    buildDirectWhatsAppMessage(pathname),
  );
  if (!href) return null;

  return (
    <a
      href={href}
      className={styles.button}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Écrire à Qualifyr sur WhatsApp"
      title="WhatsApp"
    >
      <BrandIcon name="whatsapp" className={styles.icon} />
      <span className={styles.tooltip} aria-hidden="true">
        WhatsApp
      </span>
      <span className={styles.badge} aria-hidden="true">
        +1
      </span>
    </a>
  );
}
