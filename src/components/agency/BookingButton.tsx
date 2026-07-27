'use client';

import type { ComponentProps } from 'react';
import { agencyChannels } from '@/content/agency-channels';
import { Button, ButtonLink } from '@/components/ui/Button';

export const bookingPopoverId = 'qualifyr-booking-calendar';

type BookingButtonProps = Pick<
  ComponentProps<typeof ButtonLink>,
  'children' | 'variant' | 'className' | 'withArrow'
> & {
  onClick?: () => void;
};

export function BookingButton({ onClick, ...props }: BookingButtonProps) {
  if (agencyChannels.bookingUrl) {
    return (
      <Button
        {...props}
        popoverTarget={bookingPopoverId}
        popoverTargetAction="show"
        {...(onClick ? { onClick } : {})}
      />
    );
  }

  return <ButtonLink href="/contact" {...(onClick ? { onClick } : {})} {...props} />;
}
