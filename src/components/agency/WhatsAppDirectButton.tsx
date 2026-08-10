'use client';

import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';
import { agencyChannels } from '@/content/agency-channels';
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button';
import { buildDirectWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp';

type WhatsAppDirectButtonProps = Pick<
  ComponentProps<typeof ButtonLink>,
  'children' | 'variant' | 'className' | 'withArrow' | 'onClick' | 'ctaId'
>;

/**
 * Conversation directe, sans questionnaire ni promesse de transmission.
 *
 * Le message pré-rempli reprend la page d'où part le visiteur : c'est ce qui
 * transforme un bouton en début de conversation plutôt qu'en page blanche.
 */
export function WhatsAppDirectButton(props: WhatsAppDirectButtonProps) {
  const pathname = usePathname();

  const href = buildWhatsAppUrl(
    agencyChannels.whatsappNumber,
    buildDirectWhatsAppMessage(pathname),
  );

  if (!href) {
    return <ButtonLink href="/contact" {...props} />;
  }

  return (
    <ButtonAnchor
      href={href}
      target="_blank"
      analyticsEvent="whatsapp_direct_opened"
      analyticsDestination="whatsapp"
      {...props}
    />
  );
}
