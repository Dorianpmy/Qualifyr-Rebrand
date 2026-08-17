'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureAttribution, hasCampaign, touchFromLocation } from '@/lib/attribution';
import { trackEvent } from '@/lib/analytics';

export function AttributionCapture() {
  const pathname = usePathname();

  useEffect(() => {
    const touch = touchFromLocation(window.location.href, document.referrer);
    captureAttribution(window.location.href, document.referrer);
    if (hasCampaign(touch)) {
      trackEvent('campaign_redirect_used', {
        pagePath: window.location.pathname,
        campaign: touch.campaign,
        source: touch.source,
        medium: touch.medium,
      });
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-analytics-event]')
        : null;
      const name = target?.dataset.analyticsEvent;
      if (!target || !name) return;
      trackEvent(name as Parameters<typeof trackEvent>[0], {
        pagePath: window.location.pathname,
        ctaId: target.dataset.ctaId,
        vertical: target.dataset.analyticsVertical,
        destination: target.dataset.analyticsDestination,
      });
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (pathname === '/nettoyage-automobile' || pathname === '/conciergerie') {
      trackEvent('page_specialisee_viewed', {
        pagePath: pathname,
        vertical: pathname === '/conciergerie' ? 'conciergerie' : 'nettoyage-automobile',
      });
    }
  }, [pathname]);

  return null;
}
