import { NextResponse } from 'next/server';
import { campaignLinks, isCampaignSlug } from '@/content/campaign-links';

export async function GET(
  request: Request,
  context: { params: Promise<{ campaign: string }> },
) {
  const { campaign } = await context.params;

  if (!isCampaignSlug(campaign)) {
    return NextResponse.redirect(new URL('/', request.url), 307);
  }

  return NextResponse.redirect(new URL(campaignLinks[campaign], request.url), 307);
}
