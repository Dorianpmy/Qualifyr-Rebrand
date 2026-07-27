import { agencyChannels } from '@/content/agency-channels';
import styles from './FloatingWhatsApp.module.css';

export function FloatingWhatsApp() {
  if (!agencyChannels.whatsappNumber) return null;

  const message = 'Bonjour, je souhaite discuter de mon projet avec Qualifyr.';
  const href = `https://wa.me/${agencyChannels.whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      className={styles.button}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Écrire à Qualifyr sur WhatsApp"
      title="WhatsApp"
    >
      <span aria-hidden="true">WA</span>
      <span className={styles.badge} aria-hidden="true">+1</span>
    </a>
  );
}
