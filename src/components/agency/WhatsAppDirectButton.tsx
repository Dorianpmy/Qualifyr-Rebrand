import type { ComponentProps } from 'react';
import { agencyChannels } from '@/content/agency-channels';
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button';
import { buildDirectWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp';

type WhatsAppDirectButtonProps = Pick<
  ComponentProps<typeof ButtonLink>,
  'children' | 'variant' | 'className' | 'withArrow' | 'onClick' | 'ctaId'
>;

/** Conversation directe, sans questionnaire ni promesse de transmission. */
export function WhatsAppDirectButton(props: WhatsAppDirectButtonProps) {
  const href = buildWhatsAppUrl(
    agencyChannels.whatsappNumber,
    buildDirectWhatsAppMessage(),
  );

  if (!href) {
    return <ButtonLink href="/contact" {...props} />;
  }

  return <ButtonAnchor href={href} target="_blank" analyticsEvent="whatsapp_direct_opened" analyticsDestination="whatsapp" {...props} />;
}
