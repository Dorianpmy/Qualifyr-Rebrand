import type { Metadata } from 'next';
import { VerticalServicePage } from '@/components/editorial/VerticalServicePage';
import { JsonLd } from '@/components/seo/JsonLd';
import { conciergeVertical } from '@/content/verticals';
import { buildMetadata } from '@/lib/metadata';
import { faqPage, verticalService, webPage } from '@/lib/structured-data';

export const metadata: Metadata = buildMetadata('/conciergerie');

export default function ConciergePage() {
  return (
    <>
      <JsonLd data={webPage('/conciergerie')} />
      <JsonLd data={verticalService(conciergeVertical)} />
      <JsonLd data={faqPage('/conciergerie', conciergeVertical.faq)} />
      <VerticalServicePage content={conciergeVertical} />
    </>
  );
}
