import type { Metadata } from 'next';
import { DarkFooter } from '@/components/agency/DarkFooter';
import { DarkHeader } from '@/components/agency/DarkHeader';
import { DarkHero } from '@/components/agency/DarkHero';
import { DarkPricing } from '@/components/agency/DarkPricing';
import { DemoSection } from '@/components/agency/DemoSection';
import {
  CardsSection,
  CtaSection,
  FaqSection,
  JourneySection,
  WhyUsSection,
} from '@/components/agency/DarkVerticalPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { automotiveVertical } from '@/content/verticals';
import { buildMetadata } from '@/lib/metadata';
import { faqPage, verticalService, webPage } from '@/lib/structured-data';

export const metadata: Metadata = buildMetadata('/nettoyage-automobile');

/**
 * Page métier — nettoyage automobile et detailing.
 *
 * **Refonte complète à la charte sombre.** La version précédente vivait sur
 * l'ancienne direction artistique : accent vert, bulle WhatsApp flottante,
 * en-tête clair, sections en modules CSS. Un professionnel qui arrivait ici
 * depuis la page d'accueil voyait deux produits différents.
 *
 * **Le contenu n'a pas bougé.** Tout vient de `content/verticals.ts`, comme
 * avant : problèmes, réponse, parcours, résultats, arguments, FAQ. Refondre la
 * mise en page et réécrire le discours en même temps aurait rendu impossible
 * de savoir lequel des deux a changé quelque chose.
 *
 * **L'ordre suit les objections, pas le produit.** On nomme d'abord ce qui
 * coûte des créneaux, puis ce qu'on construit, puis le parcours, puis le
 * résultat. La démonstration arrive après : à ce stade le visiteur sait ce
 * qu'il regarde, et manipuler le tunnel confirme au lieu d'introduire.
 *
 * **Les données structurées sont conservées.** Elles portent le référencement
 * de la page et n'ont aucun rapport avec sa présentation — les perdre dans une
 * refonte visuelle est l'erreur classique, et elle ne se voit pas à l'écran.
 */

export const dynamic = 'force-dynamic';

const { hero, problems, response, journey, outcomes, whyUs, faq, cta } = automotiveVertical;

export default function AutomotiveCleaningPage() {
  return (
    <div data-theme="dark" className="bg-ink">
      <JsonLd data={webPage('/nettoyage-automobile')} />
      <JsonLd data={verticalService(automotiveVertical)} />
      <JsonLd data={faqPage('/nettoyage-automobile', faq)} />

      <DarkHeader />

      <DarkHero
        eyebrow="Nettoyage automobile & detailing"
        title={hero.title}
        subtitle={hero.lead}
        ctaLabel="Tester le tunnel client"
        ctaHref="#demo-title"
        secondaryLabel={hero.secondaryLabel}
        secondaryHref={hero.secondaryHref}
        ctaNote="Démonstration complète, sans inscription."
        /*
         * `trust` et non `proof` : le bandeau de réassurance ne cite aucun
         * chiffre. La page d'accueil affiche encore « +100 utilisateurs », que
         * tu as indiqué ne pas être vrai — le reproduire ici multiplierait
         * l'affirmation invérifiable au lieu de la corriger.
         */
        trust
      />

      <CardsSection
        id="problems-title"
        eyebrow={problems.eyebrow}
        title={problems.title}
        lead={problems.lead}
        items={problems.items}
      />

      {/* La seule section à contour dégradé de la page avant la démonstration :
          c'est celle qui décrit ce qu'on vend. */}
      <CardsSection
        id="response-title"
        eyebrow={response.eyebrow}
        title={response.title}
        lead={response.lead}
        items={response.items}
        highlight
        className="border-t border-hairline"
      />

      <JourneySection
        eyebrow={journey.eyebrow}
        title={journey.title}
        lead={journey.lead}
        steps={journey.steps}
      />

      {/* `outcomes` et `whyUs` sont facultatifs dans le modèle de contenu :
          toutes les verticales n'en auront pas. Un bloc rendu sur des données
          absentes afficherait un titre surmontant le vide. */}
      {outcomes ? (
        <CardsSection
          id="outcomes-title"
          eyebrow={outcomes.eyebrow}
          title={outcomes.title}
          lead={outcomes.lead}
          items={outcomes.items}
        />
      ) : null}

      {/* La démonstration après l'argumentaire, jamais avant : un tunnel
          manipulé par quelqu'un qui ne sait pas encore ce qu'il regarde ne
          prouve rien. */}
      <DemoSection />

      {whyUs ? (
        <WhyUsSection
          eyebrow={whyUs.eyebrow}
          title={whyUs.title}
          lead={whyUs.lead}
          items={whyUs.items}
        />
      ) : null}

      <FaqSection items={faq} />

      <DarkPricing />

      <CtaSection
        eyebrow={cta.eyebrow}
        title={cta.title}
        body={cta.body}
        primary={{ href: '/diagnostic', label: 'Faire le diagnostic' }}
        secondary={{ href: '/contact', label: 'Nous écrire' }}
      />

      <DarkFooter />
    </div>
  );
}
