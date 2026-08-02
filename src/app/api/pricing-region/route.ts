import { resolvePricingRegion } from '@/lib/offer-configurator';

export const dynamic = 'force-dynamic';

const countryHeaders = [
  'x-nf-country',
  'x-vercel-ip-country',
  'cf-ipcountry',
  'cloudfront-viewer-country',
] as const;

export function GET(request: Request) {
  const country = countryHeaders
    .map((header) => request.headers.get(header)?.trim().toUpperCase())
    .find((value) => value?.length === 2) ?? null;

  return Response.json(
    { country, region: resolvePricingRegion(country) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
