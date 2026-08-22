import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logServerEvent } from '@/lib/analytics-server';
import { clientIp, rateLimit } from '@/lib/rate-limit';

/**
 * Collecteur d'événements côté navigateur — voir `src/lib/analytics.ts`
 * (`trackEvent`) pour l'appelant, et la migration 014 pour ce qu'il écrit.
 *
 * Répond toujours 204, y compris en cas de payload invalide ou de limite de
 * débit atteinte : c'est un appel de mesure, pas une action de l'utilisateur.
 * Le faire échouer bruyamment n'aiderait ni le visiteur ni le tableau de
 * bord — au pire, un événement manque.
 */

const bodySchema = z.object({
  eventName: z.string().min(1).max(80),
  pagePath: z.string().max(500).optional(),
  ctaId: z.string().max(120).optional(),
  sessionId: z.string().max(80).optional(),
  utmSource: z.string().max(80).optional(),
  utmMedium: z.string().max(80).optional(),
  utmCampaign: z.string().max(120).optional(),
  utmContent: z.string().max(120).optional(),
  utmTerm: z.string().max(120).optional(),
  referrerDomain: z.string().max(120).optional(),
});

// Généreux par rapport aux routes métier : une seule page peut légitimement
// déclencher plusieurs événements (vue de page, puis clic). Protège quand
// même contre un script qui inonderait la table.
const TRACK_RATE_LIMIT = { windowMs: 60 * 1000, max: 60 } as const;

export async function POST(request: Request) {
  if (!rateLimit(`track:${clientIp(request)}`, TRACK_RATE_LIMIT)) {
    return new NextResponse(null, { status: 204 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new NextResponse(null, { status: 204 });
  }

  const data = parsed.data;
  await logServerEvent({
    eventName: data.eventName,
    pagePath: data.pagePath,
    ctaId: data.ctaId,
    sessionId: data.sessionId,
    utmSource: data.utmSource,
    utmMedium: data.utmMedium,
    utmCampaign: data.utmCampaign,
    utmContent: data.utmContent,
    utmTerm: data.utmTerm,
    referrerDomain: data.referrerDomain,
  });

  return new NextResponse(null, { status: 204 });
}
