import { readAttribution } from '@/lib/attribution';

export type AnalyticsEventName =
  | 'page_specialisee_viewed'
  | 'case_study_viewed'
  | 'estimation_started'
  | 'estimation_completed'
  | 'booking_opened'
  | 'whatsapp_direct_opened'
  | 'campaign_redirect_used'
  // Ajoutés le 22/08/2026 (phase 2 de l'audit growth) — tunnel principal :
  // CTA du hero → formulaire de zone (le plus proche d'une « qualification »
  // qui existe aujourd'hui, voir agent/scan) → abonnement → paiement.
  | 'cta_hero_clicked'
  | 'cta_secondary_clicked'
  | 'pricing_cta_clicked'
  | 'subscribe_button_clicked'
  | 'zone_scan_requested'
  | 'dashboard_login_succeeded';

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

const SESSION_ID_KEY = 'qualifyr-session-id';

/**
 * Identifiant de corrélation, pas un identifiant personnel : aléatoire,
 * stocké en `sessionStorage` (disparaît à la fermeture de l'onglet), sans
 * lien avec un compte ou un e-mail tant que le visiteur ne s'est pas
 * authentifié. Permet de relier « CTA cliqué » et « paiement effectué » dans
 * la même session sans déposer de cookie.
 */
function sessionId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const next = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_ID_KEY, next);
    return next;
  } catch {
    return undefined;
  }
}

export function trackEvent(name: AnalyticsEventName, properties: AnalyticsProperties = {}) {
  if (typeof window === 'undefined') return;

  const detail = { name, ...properties };
  window.dispatchEvent(new CustomEvent('qualifyr:analytics', { detail }));
  window.dataLayer?.push({ event: name, ...properties });

  // Collecteur maison (migration 014 + /api/track) : voir le commentaire de
  // `analytics-server.ts` pour pourquoi ce chemin existe en l'absence de tout
  // outil de mesure tiers installé sur le site. `keepalive` laisse la requête
  // partir même si un clic déclenche une navigation immédiate (ex. CTA qui
  // ouvre Stripe).
  // Réutilise le stockage déjà posé par `captureAttribution`
  // (`AttributionCapture.tsx`, monté globalement) plutôt que de relire et
  // reparser `sessionStorage` ici avec sa propre logique.
  const attribution = readAttribution()?.lastTouch ?? {};

  const payload = {
    eventName: name,
    pagePath: properties.pagePath ?? window.location.pathname,
    ctaId: properties.ctaId,
    sessionId: sessionId(),
    utmSource: attribution.source,
    utmMedium: attribution.medium,
    utmCampaign: attribution.campaign,
    utmContent: attribution.content,
    utmTerm: attribution.term,
    referrerDomain: document.referrer || undefined,
  };

  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Mesure manquée, jamais bloquant pour le visiteur.
    });
  } catch {
    // `fetch` indisponible (contexte très ancien) : rien à faire de plus.
  }
}
