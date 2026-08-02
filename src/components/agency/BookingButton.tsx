'use client';

import type { ComponentProps } from 'react';
import { agencyChannels } from '@/content/agency-channels';
import { Button, ButtonLink } from '@/components/ui/Button';

export const bookingPopoverId = 'qualifyr-booking-calendar';

type BookingButtonProps = Pick<
  ComponentProps<typeof ButtonLink>,
  'children' | 'variant' | 'className' | 'withArrow' | 'ctaId'
> & {
  onClick?: () => void;
};

export function BookingButton({ onClick, ...props }: BookingButtonProps) {
  if (agencyChannels.bookingUrl) {
    return (
      <Button
        {...props}
        analyticsEvent="booking_opened"
        analyticsDestination="calendar"
        popoverTarget={bookingPopoverId}
        popoverTargetAction="show"
        {...(onClick ? { onClick } : {})}
      />
    );
  }

  return <ButtonLink href="/contact" analyticsEvent="booking_opened" analyticsDestination="/contact" {...(onClick ? { onClick } : {})} {...props} />;
}
