const STORAGE_KEY = 'qualifyr-attribution-session';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export type AttributionTouch = {
  source?: string | undefined;
  medium?: string | undefined;
  campaign?: string | undefined;
  content?: string | undefined;
  term?: string | undefined;
  referrerDomain?: string | undefined;
  landingPath?: string | undefined;
  firstSeenAt?: string | undefined;
};

export type AttributionData = {
  firstTouch?: AttributionTouch | undefined;
  lastTouch?: AttributionTouch | undefined;
};

function limited(value: string | null | undefined, max: number) {
  const cleaned = value?.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
  return cleaned || undefined;
}

function sanitizeTouch(value: unknown): AttributionTouch | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const touch = value as Record<string, unknown>;
  const read = (key: string, max: number) =>
    typeof touch[key] === 'string' ? limited(touch[key], max) : undefined;
  return {
    source: read('source', 80),
    medium: read('medium', 80),
    campaign: read('campaign', 120),
    content: read('content', 120),
    term: read('term', 120),
    referrerDomain: read('referrerDomain', 120),
    landingPath: read('landingPath', 500),
    firstSeenAt: read('firstSeenAt', 40),
  };
}

function externalReferrerDomain(referrer: string, currentHost: string) {
  if (!referrer) return undefined;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return host && host !== currentHost.toLowerCase() ? limited(host, 120) : undefined;
  } catch {
    return undefined;
  }
}

export function touchFromLocation(href: string, referrer = '', now = new Date()): AttributionTouch {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { firstSeenAt: now.toISOString() };
  }
  const campaignParams = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const value = limited(url.searchParams.get(key), key === 'utm_campaign' ? 120 : 80);
    if (value) campaignParams.set(key, value);
  }
  const query = campaignParams.toString();
  return {
    source: limited(url.searchParams.get('utm_source'), 80),
    medium: limited(url.searchParams.get('utm_medium'), 80),
    campaign: limited(url.searchParams.get('utm_campaign'), 120),
    content: limited(url.searchParams.get('utm_content'), 120),
    term: limited(url.searchParams.get('utm_term'), 120),
    referrerDomain: externalReferrerDomain(referrer, url.hostname),
    landingPath: limited(`${url.pathname}${query ? `?${query}` : ''}`, 500),
    firstSeenAt: now.toISOString(),
  };
}

export function hasCampaign(touch: AttributionTouch) {
  return UTM_KEYS.some((key) => {
    const property = key.replace('utm_', '') as keyof AttributionTouch;
    return Boolean(touch[property]);
  });
}

export function mergeAttribution(
  existing: AttributionData | undefined,
  current: AttributionTouch,
): AttributionData {
  if (!existing?.firstTouch) return { firstTouch: current, lastTouch: current };
  return {
    firstTouch: existing.firstTouch,
    lastTouch: hasCampaign(current) ? current : (existing.lastTouch ?? existing.firstTouch),
  };
}

export function readAttribution(): AttributionData | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const firstTouch = sanitizeTouch(parsed.firstTouch);
    const lastTouch = sanitizeTouch(parsed.lastTouch);
    return firstTouch || lastTouch ? { firstTouch, lastTouch } : undefined;
  } catch {
    return undefined;
  }
}

export function captureAttribution(href: string, referrer = '') {
  if (typeof window === 'undefined') return undefined;
  const next = mergeAttribution(readAttribution(), touchFromLocation(href, referrer));
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return next;
  }
  return next;
}
