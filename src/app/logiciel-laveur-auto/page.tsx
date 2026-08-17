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
import { faq } from '@/content/faq';
import { geoQna } from '@/content/geo';
import { buildMetadata } from '@/lib/metadata';
import { breadcrumbList, webPage } from '@/lib/structured-data';

export const metadata: Metadata = buildMetadata('/logiciel-laveur-auto');

/**
 * Page flagship — mot-clé principal « logiciel pour laveur auto ».
 *
 * Contenu distinct de `/logiciel-detailing-automobile` (audience detailing)
 * et de `/nettoyage-automobile` (tunnel de vente complet, agent + démo) :
 * celle-ci reste centrée sur la gestion lavage auto à domicile et mobile —
 * demandes, réservations, clients — sans dupliquer le contenu des deux
 * autres pages.
 */
const problems = {
  eyebrow: 'Ce qui vous coûte du temps',
  title: 'Gérer un planning de lavage auto à la main a une limite.',
  lead:
    'Entre les messages Instagram, les appels et le carnet papier, chaque nouvelle demande de devis prend du temps à traiter — et une partie se perd en route.',
  items: [
    {
      number: '01',
      title: 'Les demandes de devis se dispersent',
      body: 'Une question sur les tarifs arrive par message privé, une autre par téléphone : rien n’est centralisé nulle part.',
    },
    {
      number: '02',
      title: 'La réservation prend plusieurs échanges',
      body: 'Véhicule, formule, créneau, adresse : chaque information manquante rallonge l’échange avant de confirmer un rendez-vous.',
    },
    {
      number: '03',
      title: 'Le suivi client repart de zéro',
      body: 'Sans historique centralisé, difficile de savoir qui a déjà réservé, qui hésite encore, ou qui mérite une relance.',
    },
  ],
} as const;

const response = {
  eyebrow: 'Ce que fait le logiciel',
  title: 'Un logiciel pensé pour l’activité de lavage auto.',
  lead:
    'Qualifyr est le SaaS tout-en-un conçu pour les laveurs auto à domicile et mobiles : demandes, réservations, prospects et clients réunis dans un seul outil.',
  items: [
    {
      number: '01',
      title: 'Devis lavage automobile en ligne',
      body: 'Le client indique son véhicule et sa formule, le prix ferme s’affiche immédiatement — plus de devis rédigé le soir.',
    },
    {
      number: '02',
      title: 'Réservation lavage auto centralisée',
      body: 'Chaque demande de créneau arrive complète, avec l’acompte encaissé au moment de la réservation.',
    },
    {
      number: '03',
      title: 'Gestion clients laveur auto',
      body: 'Prospects et clients sont suivis au même endroit : qui a réservé, qui hésite, qui revient.',
    },
  ],
} as const;

const journey = {
  eyebrow: 'Le parcours',
  title: 'Du premier message au client fidélisé.',
  lead: 'Chaque étape répond à une question réelle du client, dans l’ordre où il se la pose.',
  steps: [
    { number: '01', title: 'Découvrir', body: 'Le client trouve vos formules et votre zone d’intervention.' },
    { number: '02', title: 'Choisir', body: 'Il compare les formules de lavage auto à domicile selon son véhicule.' },
    { number: '03', title: 'Réserver', body: 'Il propose un créneau, l’acompte est encaissé, le rendez-vous est tenu.' },
    { number: '04', title: 'Revenir', body: 'Son historique reste dans votre espace pro pour la prochaine demande.' },
  ],
} as const;

const faqItems = [
  ...geoQna.filter((item) =>
    ['Qualifyr est-il une agence de création de sites web ou un logiciel SaaS ?', 'À qui s’adresse Qualifyr ?'].includes(item.question),
  ),
  ...faq.filter((item) => item.question === 'Peut-on intégrer une prise de rendez-vous ?'),
];

export default function LogicielLaveurAutoPage() {
  return (
    <div data-theme="dark" className="bg-ink">
      <JsonLd data={webPage('/logiciel-laveur-auto')} />
      <JsonLd
        data={breadcrumbList([
          { name: 'Accueil', path: '/' },
          { name: 'Logiciel laveur auto', path: '/logiciel-laveur-auto' },
        ])}
      />

      <DarkHeader />

      <DarkHero
        eyebrow="SaaS laveur auto"
        title="Logiciel pour laveur auto : devis, réservations et clients"
        subtitle="Un logiciel conçu pour les laveurs auto à domicile et mobiles, pour gérer les demandes, les réservations, les prospects et les clients depuis un seul outil."
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
        body="Gérez vos demandes de devis, vos réservations et vos clients de lavage auto depuis un seul outil, sans engagement."
        primary={{ href: '/nettoyage-automobile', label: 'Créer mon compte' }}
        secondary={{ href: '/logiciel-detailing-automobile', label: 'Voir la page detailing' }}
      />

      <DarkFooter />
    </div>
  );
}
