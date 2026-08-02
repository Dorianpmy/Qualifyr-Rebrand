import type { ComponentProps } from 'react';
import { ButtonLink } from '@/components/ui/Button';

type DiagnosticLinkProps = Omit<ComponentProps<typeof ButtonLink>, 'href'>;

/** Entrée unique vers le diagnostic commercial Qualifyr. */
export function DiagnosticLink({ analyticsVertical, ...props }: DiagnosticLinkProps) {
  const href = analyticsVertical
    ? (`/diagnostic?activity=${analyticsVertical}` as const)
    : '/diagnostic';
  return <ButtonLink href={href} analyticsVertical={analyticsVertical} {...props} />;
}
