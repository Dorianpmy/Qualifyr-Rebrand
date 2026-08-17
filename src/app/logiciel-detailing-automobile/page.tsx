import type { Metadata } from 'next';
import { DarkFooter } from '@/components/agency/DarkFooter';
import { DarkHeader } from '@/components/agency/DarkHeader';
import { DarkHero } from '@/components/agency/DarkHero';
import { DarkPricing } from '@/components/agency/DarkPricing';
import {
  CardsSection,
  CtaSection,
  FaqSection,
  JourneySection,
} from '@/components/agency/DarkVerticalPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { geoQna } from '@/content/geo';
import { buildMetadata } from '@/lib/metadata';
import { breadcrumbList, webPage } from '@/lib/structured-data';

export const metadata: Metadata = buildMetadata('/logiciel-detailing-automobile');

/**
 * Page flagship — mot-clé principal « logiciel detailing automobile ».
 *
 * Contenu distinct de `/logiciel-laveur-auto` : cette page s'adresse aux
 * professionnels du detailing et de la préparation esthétique (niveaux de
 * finition, état du véhicule) plutôt qu'au lavage auto généraliste — même
 * logiciel, angle de lecture différent, pas un copier-coller.
 */
const problems = {
  eyebrow: 'Ce qui vous coûte du temps',
  title: 'Le detailing se vend mal en dix messages privés.',
  lead:
    'Un niveau de finition ou une préparation esthétique s’explique en quelques minutes en face à face — beaucoup plus difficilement dans un fil de conversation Instagram.',
  items: [
    {
      number: '01',
      title: 'Les niveaux de finition sont difficiles à comparer',
      body: 'Le client hésite entre plusieurs formules de detailing sans voir ce qui change concrètement pour son véhicule.',
    },
    {
      number: '02',
      title: 'L’état réel du véhicule arrive trop tard',
      body: 'Rayures, taches, état de la sellerie : sans ces informations avant le rendez-vous, le devis change sur place.',
    },
    {
      number: '03',
      title: 'La préparation esthétique se négocie à chaque fois',
      body: 'Sans grille claire, chaque demande redevient une négociation, même pour une prestation déjà standardisée.',
    },
  ],
} as const;

const response = {
  eyebrow: 'Ce que fait le logiciel',
  title: 'Un SaaS pensé pour le detailing automobile.',
  lead:
    'Qualifyr aide les professionnels du detailing et de la préparation esthétique à gérer leurs demandes, réservations, prospects et clients depuis un seul logiciel.',
  items: [
    {
      number: '01',
      title: 'Formules de detailing lisibles',
      body: 'Chaque niveau de finition est présenté avec son prix et ce qu’il inclut, pour que le client choisisse sans vous écrire.',
    },
    {
      number: '02',
      title: 'État du véhicule renseigné avant le rendez-vous',
      body: 'Le client précise l’état réel de son véhicule au moment de la demande, pas le jour de la prestation.',
    },
    {
      number: '03',
      title: 'Suivi des clients de detailing',
      body: 'Historique des prestations et des véhicules suivis, pour proposer un entretien régulier plutôt qu’une prestation isolée.',
    },
  ],
} as const;

const journey = {
  eyebrow: 'Le parcours',
  title: 'De la demande à la prestation soignée.',
  lead: 'Le parcours s’adapte à ce qui fait vraiment hésiter avant une prestation de detailing.',
  steps: [
    { number: '01', title: 'Découvrir', body: 'Le client voit vos niveaux de finition et votre zone d’intervention.' },
    { number: '02', title: 'Choisir', body: 'Il compare les formules de detailing automobile selon son véhicule.' },
    { number: '03', title: 'Préciser', body: 'Il indique l’état réel du véhicule et le lieu d’intervention.' },
    { number: '04', title: 'Réserver', body: 'La demande de créneau part complète, acompte compris.' },
  ],
} as const;

const faqItems = geoQna.filter((item) =>
  ['Qu’est-ce que Qualifyr ?', 'À qui s’adresse Qualifyr ?', 'Qualifyr cible-t-il d’autres secteurs que le lavage auto et le detailing ?'].includes(
    item.question,
  ),
);

export default function LogicielDetailingAutomobilePage() {
  return (
    <div data-theme="dark" className="bg-ink">
      <JsonLd data={webPage('/logiciel-detailing-automobile')} />
      <JsonLd
        data={breadcrumbList([
          { name: 'Accueil', path: '/' },
          { name: 'Logiciel detailing automobile', path: '/logiciel-detailing-automobile' },
        ])}
      />

      <DarkHeader />

      <DarkHero
        eyebrow="SaaS detailing automobile"
        title="Logiciel pour detailing automobile et lavage mobile"
        subtitle="Développez votre activité de detailing et de lavage auto mobile avec un SaaS conçu pour gérer vos demandes, vos réservations et vos clients."
        ctaLabel="Créer mon compte"
        ctaHref="/nettoyage-automobile"
        secondaryLabel="Voir les fonctionnalités"
        secondaryHref="/fonctionnalites"
        ctaNote="Essai gratuit, sans carte bancaire."
        trust
      />

      <CardsSection id="problems-title" eyebrow={problems.eyebrow} title={problems.title} lead={problems.lead} items={problems.items} />

      <CardsSection
        id="response-title"
        eyebrow={response.eyebrow}
        title={response.title}
        lead={response.lead}
        items={response.items}
        highlight
        className="border-t border-hairline"
      />

      <JourneySection eyebrow={journey.eyebrow} title={journey.title} lead={journey.lead} steps={journey.steps} />

      <FaqSection items={faqItems} />

      <DarkPricing />

      <CtaSection
        eyebrow="Votre activité"
        title="Essayez le logiciel sur votre zone."
        body="Gérez vos demandes, vos réservations et vos clients de detailing automobile depuis un seul outil, sans engagement."
        primary={{ href: '/nettoyage-automobile', label: 'Créer mon compte' }}
        secondary={{ href: '/logiciel-laveur-auto', label: 'Voir la page lavage auto' }}
      />

      <DarkFooter />
    </div>
  );
}
