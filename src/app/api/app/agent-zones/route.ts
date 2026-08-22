import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requestZone } from '@/lib/agent/zones';
import { isGuardFailure, requireCapability } from '@/lib/billing/guard';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';

/**
 * Demande de zone depuis l'espace pro.
 *
 * **Pas de champ e-mail dans le formulaire.** Le visiteur anonyme du site
 * vitrine doit en fournir un ; le detailer connecté en a déjà un, celui de sa
 * fiche. Lui redemander l'information qu'on possède déjà casse la confiance
 * qu'un espace « pro » est censé inspirer.
 */

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  zone: z.string().regex(/^\d{4,5}$/, 'Code postal invalide.'),
  radiusKm: z.number().int().min(5).max(50).optional(),
});

export async function POST(request: Request) {
  /* `requireCapability` remplace la vérification de session seule : elle
     vérifie l'authentification **et** que l'abonnement inclut la prospection.
     Sans elle, un abonné « Système seul » créerait des zones d'agent qu'il
     n'a pas payées, simplement en appelant cette URL. */
  const guard = await requireCapability('agent.prospecting');
  if (isGuardFailure(guard)) return guard.response;
  const { user } = guard;

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) {
    return NextResponse.json({ error: 'Compte non lié à une fiche detailer.' }, { status: 403 });
  }

  if (!detailer.email) {
    return NextResponse.json(
      { error: 'Aucune adresse e-mail sur la fiche detailer. Complétez vos réglages.' },
      { status: 422 },
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
    email: detailer.email,
    postalCode: parsed.data.zone,
    radiusKm: parsed.data.radiusKm,
    detailerId: detailer.id,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: result.message },
      { status: result.status },
    );
  }

  return NextResponse.json(result);
}
