import 'server-only';
import { detailingServiceEnv } from '@/lib/detailing/env';

/**
 * Écriture d'un événement dans `analytics_events` (migration 014).
 *
 * Utilisée par deux appelants : `/api/track` (événements déclenchés côté
 * navigateur — clic sur un CTA, vue de page) et directement par les routes
 * serveur qui savent qu'un événement métier vient de se produire sans passage
 * navigateur (webhook Stripe, connexion réussie, demande de zone). Un seul
 * chemin d'écriture pour les deux cas plutôt que de dupliquer la logique.
 *
 * **Ne jette jamais.** Une mesure ratée ne doit pas faire échouer l'action
 * réelle (un paiement confirmé, une connexion) — l'erreur est journalisée et
 * avalée.
 */

export type AnalyticsEventInput = {
  readonly eventName: string;
  readonly pagePath?: string | null | undefined;
  readonly ctaId?: string | null | undefined;
  readonly sessionId?: string | null | undefined;
  readonly utmSource?: string | null | undefined;
  readonly utmMedium?: string | null | undefined;
  readonly utmCampaign?: string | null | undefined;
  readonly utmContent?: string | null | undefined;
  readonly utmTerm?: string | null | undefined;
  readonly referrerDomain?: string | null | undefined;
  readonly detailerId?: string | null | undefined;
  readonly metadata?: Record<string, unknown> | null | undefined;
};

export async function logServerEvent(input: AnalyticsEventInput): Promise<void> {
  const env = detailingServiceEnv();
  if (!env) return; // Supabase non configuré : dégradation silencieuse, comme le reste du produit.

  try {
    const response = await fetch(`${env.url}/rest/v1/analytics_events`, {
      method: 'POST',
      headers: {
        apikey: env.serviceRoleKey,
        Authorization: `Bearer ${env.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        event_name: input.eventName,
        page_path: input.pagePath ?? null,
        cta_id: input.ctaId ?? null,
        session_id: input.sessionId ?? null,
        utm_source: input.utmSource ?? null,
        utm_medium: input.utmMedium ?? null,
        utm_campaign: input.utmCampaign ?? null,
        utm_content: input.utmContent ?? null,
        utm_term: input.utmTerm ?? null,
        referrer_domain: input.referrerDomain ?? null,
        detailer_id: input.detailerId ?? null,
        metadata: input.metadata ?? null,
      }),
    });
    if (!response.ok) {
      console.warn('[analytics] écriture refusée', response.status, await response.text());
    }
  } catch (error) {
    console.warn('[analytics] écriture impossible', error instanceof Error ? error.message : error);
  }
}
