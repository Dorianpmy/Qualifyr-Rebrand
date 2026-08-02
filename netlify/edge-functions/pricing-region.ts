type NetlifyGeoContext = {
  readonly geo?: {
    readonly country?: {
      readonly code?: string;
    };
  };
};

export default function pricingRegion(_request: Request, context: NetlifyGeoContext) {
  const country = context.geo?.country?.code?.trim().toUpperCase() ?? null;
  const region = country === 'CH' ? 'switzerland' : 'euro';

  return Response.json(
    { country, region },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export const config = { path: '/api/pricing-region' };
