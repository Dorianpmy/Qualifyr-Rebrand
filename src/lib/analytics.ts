export type AnalyticsEventName =
  | 'page_specialisee_viewed'
  | 'case_study_viewed'
  | 'diagnostic_started'
  | 'diagnostic_step_completed'
  | 'diagnostic_reviewed'
  | 'diagnostic_submitted'
  | 'diagnostic_whatsapp_opened'
  | 'estimation_started'
  | 'estimation_completed'
  | 'booking_opened'
  | 'whatsapp_direct_opened'
  | 'campaign_redirect_used';

export type AnalyticsProperties = {
  pagePath?: string | undefined;
  ctaId?: string | undefined;
  campaign?: string | undefined;
  source?: string | undefined;
  medium?: string | undefined;
  vertical?: string | undefined;
  stepNumber?: number | undefined;
  destination?: string | undefined;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackEvent(name: AnalyticsEventName, properties: AnalyticsProperties = {}) {
  if (typeof window === 'undefined') return;

  const detail = { name, ...properties };
  window.dispatchEvent(new CustomEvent('qualifyr:analytics', { detail }));
  window.dataLayer?.push({ event: name, ...properties });
}
