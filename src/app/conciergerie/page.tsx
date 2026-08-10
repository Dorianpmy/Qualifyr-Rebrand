import type { Metadata } from 'next';
import Link from 'next/link';
import { VerticalServicePage } from '@/components/editorial/VerticalServicePage';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { Eyebrow } from '@/components/ui/Eyebrow';
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

      {/* Passerelle vers le produit, en fin de parcours seulement : la page
          reste consacrée à l'offre de site, l'outil est proposé à ceux dont le
          budget ou le besoin ne correspond pas. */}
      <Section surface="sunken" spacing="tight">
        <Container>
          <Eyebrow>Autre formule</Eyebrow>
          <h2>Pas besoin d’un site complet&nbsp;?</h2>
          <p>
            Notre outil d’acquisition met en ligne une page qui estime les revenus d’un bien et
            collecte les demandes de propriétaires, pour 79 € par mois. En ligne en dix minutes,
            sans projet ni accompagnement.
          </p>
          <p>
            <Link href="/outil-conciergerie">Découvrir l’outil pour conciergerie</Link>
          </p>
          <p>
            Nous accompagnons également les conciergeries à{' '}
            <Link href="/conciergerie/lyon">Lyon</Link>,{' '}
            <Link href="/conciergerie/marseille">Marseille</Link> et{' '}
            <Link href="/conciergerie/paris">Paris</Link>.
          </p>
        </Container>
      </Section>
    </>
  );
}
