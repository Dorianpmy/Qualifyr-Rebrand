import { NextResponse } from 'next/server';
import { loadDetailerBySlug } from '@/lib/detailing/config';
import { detailingPublicEnv, detailingServiceEnv } from '@/lib/detailing/env';
import { isProduction } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Route de diagnostic — jamais destinée à rester accessible en production.
 *
 * **Cause racine (22/08/2026, audit sécurité).** Ce fichier n'a jamais vérifié
 * l'environnement : n'importe qui pouvait appeler `/api/debug/detailer?slug=…`
 * en production et apprendre si les clés Supabase sont configurées, le nom
 * d'hôte du projet, si une clé de service existe, et — en essayant des slugs —
 * si un professionnel donné existe et son nom. Rien de tout cela n'est un
 * secret en clair, mais c'est une carte pour préparer une attaque plus loin.
 * Corrigé en fermant la route hors développement plutôt qu'en la supprimant
 * (utile en local pour diagnostiquer une configuration Supabase).
 */
export async function GET(request: Request) {
  if (isProduction()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') ?? 'demo';

  const publicEnv = detailingPublicEnv();
  const serviceEnv = detailingServiceEnv();

  let detailer = null;
  let error: string | null = null;
  try {
    detailer = await loadDetailerBySlug(slug);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    slug,
    hasPublicUrl: Boolean(publicEnv?.url),
    publicUrlHost: publicEnv?.url ? new URL(publicEnv.url).host : null,
    hasAnonKey: Boolean(publicEnv?.anonKey),
    hasServiceRoleKey: Boolean(serviceEnv?.serviceRoleKey),
    found: Boolean(detailer),
    detailerName: detailer?.name ?? null,
    error,
  });
}
