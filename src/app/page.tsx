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
import { softwareApplication, webPage } from '@/lib/structured-data';

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
      {/* Le SaaS lui-même, distinct de l'organisation : voir le commentaire
          de `softwareApplication()` dans `structured-data.ts`. */}
      <JsonLd data={softwareApplication()} />

      <DarkHeader />

      <DarkHero
        eyebrow="SaaS pour laveurs auto & detailing automobile"
        /*
         * Repositionnement SaaS-first (17/08/2026, demande explicite) : le H1
         * doit porter mot pour mot la phrase de positionnement obligatoire —
         * ce n'est pas une préférence stylistique, c'est ce que Google et les
         * IA génératives lisent en premier sur la page. L'ancien titre
         * (« Ne répondez plus aux « C'est combien pour une Clio ? » ») était
         * plus incisif mais ne contenait ni « SaaS » ni « laveurs auto » :
         * illisible pour un moteur qui doit comprendre ce qu'est Qualifyr en
         * une phrase. Pas de `highlight` ici : en ajouter un romprait le H1
         * exact demandé.
         */
        title="Le SaaS tout-en-un pour les laveurs auto"
        subtitle="Gérez vos demandes, vos réservations et vos clients depuis un seul outil conçu pour le lavage automobile mobile et le detailing."
        ctaLabel="Découvrir Qualifyr"
        ctaHref="#agent-title"
        /*
         * CTA secondaire aligné sur le texte obligatoire « Essayer Qualifyr »
         * et redirigé vers `/nettoyage-automobile`, la page qui présente le
         * produit SaaS en détail (démo, tarifs, tableau de bord) — cohérent
         * avec « essayer » plutôt que « créer un site ». Le CTA « Créer mon
         * site avec Qualifyr » vit plus bas, dans `FinalCtaSection`, pour ne
         * pas dupliquer un troisième bouton dans le hero.
         */
        secondaryLabel="Essayer Qualifyr"
        secondaryHref="/nettoyage-automobile"
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
