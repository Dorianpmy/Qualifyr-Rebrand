import type { Metadata } from 'next';
import { VerticalServicePage } from '@/components/editorial/VerticalServicePage';
import { JsonLd } from '@/components/seo/JsonLd';
import { automotiveVertical } from '@/content/verticals';
import { buildMetadata } from '@/lib/metadata';
import { faqPage, verticalService, webPage } from '@/lib/structured-data';

export const metadata: Metadata = buildMetadata('/nettoyage-automobile');

export default function AutomotiveCleaningPage() {
  return (
    <>
      <JsonLd data={webPage('/nettoyage-automobile')} />
      <JsonLd data={verticalService(automotiveVertical)} />
      <JsonLd data={faqPage('/nettoyage-automobile', automotiveVertical.faq)} />
      <VerticalServicePage content={automotiveVertical} />
    </>
  );
}
