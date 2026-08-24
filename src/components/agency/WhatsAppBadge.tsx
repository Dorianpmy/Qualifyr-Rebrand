'use client';

import { usePathname } from 'next/navigation';
import { agencyChannels } from '@/content/agency-channels';
import { buildDirectWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import styles from './WhatsAppBadge.module.css';

/**
 * Point d'entrée WhatsApp, présent sur toutes les pages du site vitrine.
 *
 * **Il remplace `ConversionPrompt`, il ne s'y ajoute pas.** Celui-ci
 * surgissait après soixante secondes d'inactivité pour proposer la même
 * action : deux sollicitations pour un seul geste, dont une qui décide à la
 * place du visiteur du moment où il hésite. Un badge permanent le laisse
 * choisir, et ne coûte rien tant qu'on ne le regarde pas.
 *
 * **Pas de vert.** La charte du projet l'interdit sans exception, et un rond
 * vert pomme sur un site ivoire et charbon ruinerait en un élément le travail
 * de toutes les autres pages. L'icône WhatsApp reste reconnaissable à sa
 * forme — la bulle et le combiné — bien plus qu'à sa couleur : c'est ainsi
 * que la reconnaissent les gens qui la voient cinquante fois par jour.
 *
 * **Le message est contextuel.** `buildDirectWhatsAppMessage` prépare une
 * première phrase adaptée à la page consultée, à la première personne et
 * modifiable. Ce n'est pas un détail d'agrément : la phrase à écrire soi-même
 * est précisément l'effort qui fait renoncer.
 *
 * **Masqué sur le SaaS.** Un professionnel connecté à son espace n'est pas un
 * visiteur à convertir, et son écran est déjà chargé.
 *
 * **Rien ne s'affiche sans numéro configuré.** `agencyChannels.whatsappNumber`
 * vaut `null` si la variable d'environnement est absente : plutôt qu'un bouton
 * qui ouvre une conversation vide, il n'y a pas de bouton.
 */

function isSaaSPath(pathname: string): boolean {
  return pathname.startsWith('/app') || pathname.startsWith('/reservation');
}

export function WhatsAppBadge() {
  const pathname = usePathname();

  if (isSaaSPath(pathname)) return null;

  const href = buildWhatsAppUrl(
    agencyChannels.whatsappNumber,
    buildDirectWhatsAppMessage(pathname),
  );
  if (!href) return null;

  return (
    <a
      className={styles.badge}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      /* Le libellé dit ce qui va se passer, pas ce que montre l'icône : un
         lecteur d'écran annonce l'action, et l'ouverture dans un nouvel
         onglet est signalée plutôt que subie. */
      aria-label="Nous écrire sur WhatsApp (nouvelle fenêtre)"
      data-analytics-event="whatsapp_direct_opened"
      data-analytics-cta-id="floating_badge_whatsapp"
      data-analytics-destination="whatsapp"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={styles.icon}>
        <path
          fill="currentColor"
          d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.21.89 2.39 1.01 2.55.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z"
        />
      </svg>
    </a>
  );
}
