import type { Metadata } from 'next';
import { DarkFooter } from '@/components/agency/DarkFooter';
import { DarkHeader } from '@/components/agency/DarkHeader';
import { DarkPricing } from '@/components/agency/DarkPricing';
import {
  CardsSection,
  CtaSection,
  FaqSection,
  SectionHead,
} from '@/components/agency/DarkVerticalPage';
import { Section } from '@/components/agency/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { geoQna } from '@/content/geo';
import { buildMetadata } from '@/lib/metadata';
import { breadcrumbList, faqPage, webPage } from '@/lib/structured-data';

export const metadata: Metadata = buildMetadata('/fonctionnalites');

/**
 * Page fonctionnalités — hub central du repositionnement SaaS-first.
 *
 * **Rien n'est inventé.** Chaque carte reprend une fonctionnalité déjà
 * décrite ailleurs sur le site — `services-content.tsx` (agent de
 * prospection, réservation, filtrage), `PricingTable.tsx`/`DarkPricing.tsx`
 * (acompte, facturation FR/CH) — reformulée pour cette page, jamais un
 * ajout de fonctionnalité qui n'existerait pas dans le produit.
 */
const pillars = {
  eyebrow: 'Ce que fait le logiciel',
  title: 'Un logiciel pour laveur auto, pas un site de plus.',
  lead:
    'Qualifyr centralise ce qui, aujourd’hui, se disperse entre Instagram, les messages privés et un carnet de rendez-vous.',
  items: [
    {
      number: '01',
      title: 'Agent de prospection',
      body: 'Il démarche votre secteur pendant que vous travaillez, répond aux premières questions et ne vous transmet que les demandes qui méritent votre temps.',
    },
    {
      number: '02',
      title: 'Devis et réservation en ligne',
      body: 'Le client choisit son véhicule et sa formule, le prix ferme s’affiche à l’écran, la demande de créneau part complète — sans devis rédigé le soir.',
    },
    {
      number: '03',
      title: 'Gestion des prospects et des clients',
      body: 'Chaque demande est suivie : anonyme, acompte encaissé, créneau confirmé. Vous savez toujours où en est chaque contact.',
    },
  ],
} as const;

const operations = {
  eyebrow: 'Ce qui tourne derrière',
  title: 'La gestion lavage auto, sans y penser.',
  lead: 'Une fois la demande qualifiée, le reste s’organise sans échanges supplémentaires.',
  items: [
    {
      number: '04',
      title: 'Acompte encaissé à la réservation',
      body: 'Le créneau est tenu parce que l’acompte est déjà réglé au moment où le client réserve — pas après.',
    },
    {
      number: '05',
      title: 'Facturation France et Suisse',
      body: 'Les tarifs et la facturation s’adaptent automatiquement à la zone du client, en euros ou en francs suisses.',
    },
    {
      number: '06',
      title: 'Présence en ligne',
      body: 'Un site qui présente vos formules et vos tarifs peut faire partie de l’offre — comme fonctionnalité complémentaire du logiciel, pas comme produit séparé.',
    },
  ],
} as const;

const faqItems = geoQna.filter((item) =>
  ['Qu’est-ce que Qualifyr ?', 'Faut-il déjà avoir un site internet pour utiliser Qualifyr ?', 'Qualifyr gère-t-il les paiements et les acomptes ?', 'Combien coûte Qualifyr ?'].includes(
    item.question,
  ),
);

export default function FonctionnalitesPage() {
  return (
    <div data-theme="dark" className="bg-ink">
      <JsonLd data={webPage('/fonctionnalites')} />
      <JsonLd data={faqPage('/fonctionnalites', faqItems)} />
      <JsonLd
        data={breadcrumbList([
          { name: 'Accueil', path: '/' },
          { name: 'Fonctionnalités', path: '/fonctionnalites' },
        ])}
      />

      <DarkHeader />

      <Section className="pb-4 pt-24 sm:pt-32">
        <SectionHead
          eyebrow="Fonctionnalités"
          title="Les fonctionnalités du SaaS Qualifyr"
          lead="Un logiciel pour laveur auto conçu pour centraliser les demandes de devis, les réservations, les prospects et les clients — la création de site reste une fonctionnalité complémentaire, jamais l’activité principale de Qualifyr."
        />
      </Section>

      <CardsSection
        id="pillars-title"
        eyebrow={pillars.eyebrow}
        title={pillars.title}
        lead={pillars.lead}
        items={pillars.items}
        highlight
      />

      <CardsSection
        id="operations-title"
        eyebrow={operations.eyebrow}
        title={operations.title}
        lead={operations.lead}
        items={operations.items}
        className="border-t border-hairline"
      />

      <FaqSection items={faqItems} />

      <DarkPricing />

      <CtaSection
        eyebrow="Prêt à essayer"
        title="Voyez le logiciel sur votre propre zone."
        body="Essai gratuit, sans carte bancaire, sur le SaaS de réservation pour laveurs auto et professionnels du detailing."
        primary={{ href: '/nettoyage-automobile', label: 'Créer mon compte' }}
        secondary={{ href: '/tarifs', label: 'Voir les tarifs' }}
      />

      <DarkFooter />
    </div>
  );
}
