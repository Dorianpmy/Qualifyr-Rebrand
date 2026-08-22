import type { Metadata } from 'next';
import { DarkAgencyOffers } from '@/components/agency/DarkAgencyOffers';
import { DarkFooter } from '@/components/agency/DarkFooter';
import { DarkHeader } from '@/components/agency/DarkHeader';
import { DarkPricing } from '@/components/agency/DarkPricing';
import { CardsSection, CtaSection, SectionHead } from '@/components/agency/DarkVerticalPage';
import { Section } from '@/components/agency/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/metadata';
import { breadcrumbList, webPage } from '@/lib/structured-data';

export const metadata: Metadata = buildMetadata('/tarifs');

/**
 * Tarifs — refonte à la charte sombre (22/08/2026).
 *
 * **Cette page était restée sur l'ancienne charte claire.** Toutes les autres
 * pages produit (`/`, `/fonctionnalites`, `/nettoyage-automobile`) sont
 * passées au SaaS-first dark theme lors du repositionnement ; `/tarifs`
 * utilisait encore `Section`/`Container` de `components/layout` et
 * `PricingTable` (fond clair, boutons de l'ancienne identité). Signalé par
 * Dorian : « la page qualifyragence.com/tarifs n'est pas du tout modifié et
 * est tjs sur copier sur mon ancienne DA — refonte moi cette page aussi ».
 *
 * **Rien n'est inventé.** Les trois offres SaaS viennent de `DarkPricing`
 * (déjà utilisé sur `/`, `/fonctionnalites`, `/nettoyage-automobile` —
 * composant partagé, pas dupliqué ici) ; les deux offres de site one-shot
 * viennent de `DarkAgencyOffers`, copie mot pour mot de ce qu'affichait
 * `PricingTable.tsx` sur cette même page, seulement remise en forme sombre.
 * Les trois facteurs de prix du site reprennent le texte exact de l'ancienne
 * page.
 */
const factors = {
  eyebrow: 'Pour le site, en plus du logiciel',
  title: 'Ce qui fait varier le prix d’un site.',
  lead: 'Le logiciel a un prix fixe, affiché ci-dessus. Un site sur mesure dépend de trois choses.',
  items: [
    {
      number: '01',
      title: 'Les contenus',
      body: 'Textes et photographies existants font baisser le budget. Tout rédiger et organiser depuis zéro le fait monter.',
    },
    {
      number: '02',
      title: 'Le nombre de pages',
      body: 'Une page métier bien construite vaut mieux que six pages creuses — nous le disons quand c’est le cas.',
    },
    {
      number: '03',
      title: 'Le parcours de demande',
      body: 'Un formulaire simple ou un parcours qui qualifie, oriente et prépare l’échange ne demandent pas le même travail.',
    },
  ],
} as const;

export default function PricingPage() {
  return (
    <div data-theme="dark" className="bg-ink">
      <JsonLd data={webPage('/tarifs')} />
      <JsonLd
        data={breadcrumbList([
          { name: 'Accueil', path: '/' },
          { name: 'Tarifs', path: '/tarifs' },
        ])}
      />

      <DarkHeader />

      <Section className="pb-4 pt-24 sm:pt-32">
        <SectionHead
          eyebrow="Tarifs"
          title="Ce que ça coûte, avant de nous parler."
          lead="Le logiciel se loue au mois, prix affiché, sans devis. Le site vitrine ou le parcours de demande, vendus à part, dépendent de votre projet — mais vous saurez tout de suite si c’est dans vos moyens."
        />
      </Section>

      <DarkPricing />

      <DarkAgencyOffers />

      <CardsSection
        id="factors-title"
        eyebrow={factors.eyebrow}
        title={factors.title}
        lead={factors.lead}
        items={factors.items}
        className="border-t border-hairline"
      />

      <CtaSection
        eyebrow="La suite"
        title="Un chiffre précis, sous 48 heures."
        body="Décrivez votre situation en quelques lignes. Vous recevez une proposition chiffrée, sans relance commerciale."
        primary={{ href: '/contact', label: 'Nous contacter' }}
        secondary={{ href: '/nettoyage-automobile', label: 'Voir la démo du logiciel' }}
      />

      <DarkFooter />
    </div>
  );
}
