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
        /*
         * Badge retravaillé le 18/08/2026 (audit copywriting sitewide, ton
         * anti-bullshit demandé) : « La visibilité qui fait briller votre
         * activité » ne dit ni à qui s'adresse Qualifyr ni ce qu'il fait —
         * exactement le type de phrase que la demande liste en exemple à
         * éviter. Remplacée par une phrase d'audience, factuelle : à qui
         * s'adresse le produit, en une ligne, avant même le H1.
         */
        eyebrow="Pour les laveurs auto et préparateurs automobiles"
        /*
         * Refonte du 18/08/2026 (ton « anti-bullshit », demande explicite) :
         * remplace le H1 de positionnement SEO du tour précédent. C'est la
         * décision de contenu la plus récente, elle l'emporte.
         */
        title="Plus besoin de courir après vos clients."
        /*
         * Sous-titre : texte de la demande retravaillé sur un point précis.
         * La demande promettait d'« aider à être visible, publier
         * régulièrement... sans passer vos soirées à créer du contenu » —
         * Qualifyr n'a pas de fonctionnalité de publication de contenu ou
         * d'idées de posts (voir `services-content.tsx` : agent de
         * prospection, réservation à prix ferme, filtrage des curieux —
         * rien sur la création de contenu). La demande elle-même impose de
         * reformuler honnêtement une promesse non disponible plutôt que de
         * l'utiliser telle quelle ; ancré ici sur les trois fonctionnalités
         * réelles à la place, en gardant le même rythme et le même argument
         * « plus de soirées perdues ».
         */
        subtitle="Qualifyr démarche votre secteur, affiche un prix ferme et filtre les curieux — pour recevoir plus de demandes de lavage sans y passer vos soirées."
        /*
         * CTA : « Tester Qualifyr gratuitement → » demandé, flèche retirée
         * du texte — le bouton porte déjà une flèche SVG animée au survol
         * juste après le libellé (voir plus bas dans `DarkHero.tsx`) ;
         * garder les deux aurait affiché deux flèches côte à côte.
         */
        ctaLabel="Tester Qualifyr gratuitement"
        ctaHref="#agent-title"
        secondaryLabel="Voir comment ça marche"
        secondaryHref="#how-title"
        ctaNote="Pas de carte bancaire. Installation rapide."
        /*
         * `proof` (compteur « +100 utilisateurs » + quatre portraits) reste
         * hors service : ni le chiffre ni les visages n'étaient vrais. Voir
         * `trust` ci-dessous, dont le contenu porte maintenant les trois
         * bénéfices demandés ici.
         */
        trust
        /*
         * Nuage de bulles bleues (#1683F8) demandé explicitement — voir
         * `MessageBubble`. Réservé à l'accueil : ce même composant
         * `DarkHero` sert aussi à `/nettoyage-automobile` et aux pages
         * `/logiciel-*`, où ce nuage n'a pas été demandé.
         *
         * **Textes remplacés le 18/08/2026** (audit copywriting sitewide) :
         * les cinq messages fournis à l'origine (« Quoi poster cette
         * semaine ? », « Mes publications sont prêtes »...) décrivaient une
         * fonctionnalité de suggestions de contenu à publier que Qualifyr
         * n'a pas — même problème et même correction que pour le sous-titre
         * et les bénéfices ci-dessus. Remplacés par des messages ancrés sur
         * les fonctionnalités réelles (prospection, prix ferme, devis).
         */
        messages={[
          'C’est combien pour une Clio ?',
          'Prix affiché, acompte encaissé',
          'Fini les devis écrits le soir',
          'Un agent démarche pour vous',
          'Un client de plus cette semaine',
        ]}
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
