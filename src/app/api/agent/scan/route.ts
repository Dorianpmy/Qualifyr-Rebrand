import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requestZone } from '@/lib/agent/zones';
import { logServerEvent } from '@/lib/analytics-server';
import { clientIp, rateLimit } from '@/lib/rate-limit';

/**
 * Capture d'une zone à analyser.
 *
 * **Elle n'analyse rien.** Elle enregistre la demande et rend la main. Une
 * analyse de secteur interroge un service externe plusieurs dizaines de fois,
 * avec des pauses pour tenir le quota : entre trente secondes et deux minutes.
 * Une requête HTTP qui attend ça expire — chez l'hébergeur, chez le
 * navigateur, ou dans le tunnel 4G du visiteur.
 *
 * Le traitement réel vit dans `/api/agent/process`, déclenché par le
 * planificateur.
 *
 * **La réponse ne promet pas de délai précis.** « Sous quelques heures » est
 * tenable ; « dans 2 minutes » ne l'est pas si le quota est saturé, et une
 * promesse ratée à la première interaction coûte plus cher que l'attente.
 *
 * **Route volontairement ouverte, sans contrôle d'abonnement.** C'est l'offre
 * d'appel du site : « première zone gratuite, sans carte bancaire ». Exiger un
 * abonnement ici supprimerait la promesse commerciale au lieu de la protéger.
 * Ce qui borne l'abus n'est donc pas un droit mais une limite de débit
 * (`rateLimit` ci-dessous) : le coût réel d'une zone, c'est le quota INSEE,
 * pas un accès produit.
 *
 * La demande de zone **depuis l'espace pro** passe, elle, par
 * `api/app/agent-zones`, qui exige la capacité `agent.prospecting` : un abonné
 * « Système seul » ne peut pas se créer de zones illimitées depuis son compte.
 */

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  // Cinq chiffres en France, quatre en Suisse.
  zone: z.string().regex(/^\d{4,5}$/, 'Code postal invalide.'),
  email: z.string().email('Adresse e-mail invalide.'),
  radiusKm: z.number().int().min(5).max(50).optional(),
});

/**
 * Le quota INSEE Sirene est de 30 requêtes/minute pour TOUT le site, partagé
 * entre toutes les zones en attente (voir `/api/agent/process`) : une
 * capture non limitée pourrait à elle seule saturer ce quota et bloquer le
 * traitement des demandes déjà en file. 5 / 10 min / IP est large pour un
 * usage légitime (une poignée de zones), étroit pour un abus automatisé.
 */
const AGENT_SCAN_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 } as const;

export async function POST(request: Request) {
  if (!rateLimit(`agent-scan:${clientIp(request)}`, AGENT_SCAN_RATE_LIMIT)) {
    return NextResponse.json(
      { error: 'Trop de demandes en peu de temps. Réessayez dans quelques minutes.' },
      { status: 429 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Requête invalide.' },
      { status: 400 },
    );
  }

  const result = await requestZone({
    email: parsed.data.email,
    postalCode: parsed.data.zone,
    radiusKm: parsed.data.radiusKm,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: result.message },
      { status: result.status },
    );
  }

  // C'est aujourd'hui la seule chose qui ressemble à une « qualification » du
  // tunnel : un visiteur qui laisse une zone et un e-mail. Voir §2 de l'audit
  // growth marketing (Qualifyr-Audit-Growth-CRO.docx).
  void logServerEvent({ eventName: 'zone_scan_requested', metadata: { radiusKm: parsed.data.radiusKm ?? null } });

  return NextResponse.json(result);
}
