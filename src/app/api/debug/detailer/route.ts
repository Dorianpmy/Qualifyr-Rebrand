import { NextResponse } from 'next/server';
import { loadDetailerBySlug } from '@/lib/detailing/config';
import { detailingPublicEnv, detailingServiceEnv } from '@/lib/detailing/env';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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
