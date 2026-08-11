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

      {/* Arbitrage explicite entre les deux offres.
          Depuis que le menu segmente par métier, cette page est la porte
          d'entrée des conciergeries — et c'est la seule cible qui peut acheter
          l'une *ou* l'autre. Laisser ce choix implicite était le vrai point de
          friction du site : le visiteur qui ne sait pas laquelle est pour lui
          n'en prend aucune. Dire quand il ne faut pas nous prendre coûte moins
          cher qu'un prospect qui repart pour cause d'hésitation. */}
      <Section surface="sunken" spacing="tight">
        <Container>
          <Eyebrow>Deux formules</Eyebrow>
          <h2>Deux façons de travailler avec nous.</h2>
          <p>
            <strong>L’outil, 79 € par mois.</strong> Vous voulez des demandes de propriétaires,
            maintenant, sans projet ni budget d’agence. Une page à vos couleurs, en ligne en dix
            minutes, sans intervention de notre part.
          </p>
          <p>
            <strong>Le site sur mesure, quelques milliers d’euros.</strong> Vous voulez une
            identité, plusieurs pages, votre ton et vos photographies. C’est un projet, avec un
            accompagnement et des semaines de travail.
          </p>
          <p>
            Beaucoup de conciergeries commencent par l’outil et viennent au site une fois leur
            portefeuille constitué. L’inverse est rarement le bon ordre.
          </p>
          <p>
            <Link href="/outil-conciergerie">Voir l’outil à 79 € par mois</Link>
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
