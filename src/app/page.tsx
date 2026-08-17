import type { Metadata } from 'next';
import { AgentFlow } from '@/components/agency/AgentFlow';
import { AgentGrid } from '@/components/agency/AgentGrid';
import { CompareSection } from '@/components/agency/CompareSection';
import { FaqSection } from '@/components/agency/DarkVerticalPage';
import { homeFaq } from '@/components/agency/home-faq';
import { BeforeAfterSection } from '@/components/agency/BeforeAfterSection';
import { DarkFooter } from '@/components/agency/DarkFooter';
import { DarkHeader } from '@/components/agency/DarkHeader';
import { DarkHero } from '@/components/agency/DarkHero';
import { DarkPricing } from '@/components/agency/DarkPricing';
import { DemoSection } from '@/components/agency/DemoSection';
import { FinalCtaSection } from '@/components/agency/FinalCtaSection';
import { HowItWorks } from '@/components/agency/HowItWorks';
import { ServiceTabs } from '@/components/agency/ServiceTabs';
import { services } from '@/components/agency/services-content';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/metadata';
import { webPage } from '@/lib/structured-data';

/**
 * Page d'accueil — charte « Dark Minimalist ».
 *
 * **Elle remplace l'ancienne page.** Celle-ci vivait sur la charte agence :
 * vidéo de fond, en-tête vert, serif éditoriale. Sa version précédente est
 * conservée telle quelle dans `page.legacy.tsx.bak`, à côté de ce fichier — il
 * suffit de renommer les deux pour revenir en arrière si quelque chose manque.
 *
 * **Ordre des sections : promesse → action → explication → détail.** Le
 * formulaire d'analyse arrive tôt parce qu'un visiteur convaincu par le titre
 * doit pouvoir agir immédiatement ; l'enterrer sous deux écrans de pédagogie,
 * c'est le perdre en route. Ceux qui ont besoin de comprendre défilent, et les
 * sections suivantes répondent dans l'ordre des objections.
 *
 * **La démonstration précède les tarifs.** On ne demande pas à quelqu'un de
 * choisir un abonnement avant de lui avoir laissé toucher le produit.
 *
 * **L'habillage de l'ancienne charte est masqué automatiquement** par la règle
 * `body:has(main [data-theme='dark'])` de `tailwind.css` : la racine rend
 * encore un en-tête et un pied de page clairs pour les pages non refondues.
 */

export const metadata: Metadata = buildMetadata('/');

export default function HomePage() {
  return (
    <div data-theme="dark" className="bg-ink">
      <JsonLd data={webPage('/')} />

      <DarkHeader />

      <DarkHero
        eyebrow="SaaS de réservation + Agent IA"
        title="Ne répondez plus aux"
        highlight="« C’est combien pour une Clio ? »"
        subtitle="Gardez les mains sur la polisseuse. Votre système filtre les curieux, encaisse les acomptes, et votre agent d’acquisition démarche de nouveaux clients sur votre secteur pendant que vous travaillez."
        ctaLabel="Tester l’agent sur ma ville"
        ctaHref="#agent-title"
        /*
         * Le lien secondaire pointait vers `/nettoyage-automobile`, qui
         * présente la même offre SaaS que cette page sous un autre habillage
         * — aucun chemin n'existait donc, depuis le hero, vers l'autre offre
         * réelle de Qualifyr : les sites construits sur mesure. Corrigé pour
         * aiguiller vers cette offre plutôt que de dupliquer le CTA
         * principal.
         */
        secondaryLabel="Besoin d’un site sur mesure ?"
        secondaryHref="/creation-site-web"
        ctaNote="Sans carte bancaire. France et Suisse."
        /*
         * `proof` (compteur « +100 utilisateurs » + quatre portraits) a été
         * retiré : le commentaire qui l'accompagnait ici même disait très
         * précisément que ni le chiffre ni les visages n'étaient vrais, et
         * demandait une vérification avant mise en ligne publique — jamais
         * faite avant que le site ne devienne public. `trust` active
         * `TrustStrip`, construit pour occuper exactement cette place avec
         * trois promesses vérifiables aujourd'hui plutôt qu'un chiffre
         * invérifiable. Le jour où de vrais clients acceptent d'être cités
         * (voir la méthode de collecte de témoignages), `proof` reprend sa
         * place avec leurs vrais visages et leur nombre exact.
         */
        trust
      />

      <ServiceTabs
        eyebrow="Ce que fait le système"
        heading="Trois choses qui tournent sans vous."
        services={services}
      />

      <HowItWorks />

      <AgentFlow />

      {/* Juste après le formulaire d'analyse : le visiteur vient d'obtenir sa
          zone gratuite et se demande ce que donneraient les communes voisines.
          Le prix répond à une question qu'il se pose déjà. */}
      <AgentGrid />

      <BeforeAfterSection />

      <DemoSection />

      {/* Le comparatif juste avant les tarifs : le visiteur doit avoir en tête
          ce que les solutions qu'il utilise déjà ne savent pas faire au moment
          où il lit un prix. Sinon il compare Qualifyr à zéro, et zéro gagne
          toujours. */}
      <CompareSection />

      <DarkPricing />

      {/* La FAQ après le prix, jamais avant : ce sont les objections de
          quelqu'un qui a vu le montant et cherche une raison de ne pas y
          aller. */}
      <FaqSection items={homeFaq} />

      <FinalCtaSection />

      <DarkFooter />
    </div>
  );
}
