import type { Metadata } from 'next';

import { DarkFooter } from '@/components/agency/DarkFooter';
import { DarkHeader } from '@/components/agency/DarkHeader';
import { DarkHero } from '@/components/agency/DarkHero';
import {
  CtaSection,
  JourneySection,
  SectionHead,
  WhyUsSection,
} from '@/components/agency/DarkVerticalPage';
import { Section } from '@/components/agency/Section';
import { JsonLd } from '@/components/seo/JsonLd';

import {
  expectedOutcomes,
  includedWork,
  projectSteps,
  webDesignPage,
} from '@/content/web-design';
import { buildMetadata } from '@/lib/metadata';
import { breadcrumbList, webDesignService } from '@/lib/structured-data';

export const metadata: Metadata = buildMetadata('/creation-site-web');

/**
 * Création de site — page de l'offre élargie.
 *
 * ## Refonte du 20 septembre 2026 — la page appartenait encore à l'ancien site
 *
 * Signalée par Dorian depuis le bouton « Créer mon site avec Qualifyr » de la
 * clôture de l'accueil : « problème de DA, il faut refaire ». Le diagnostic
 * n'est pas une question de réglages, c'est une question de système.
 *
 * **La page ne posait pas `data-theme="dark"`.** Or c'est ce seul attribut qui
 * déclenche la règle de `tailwind.css`
 * (`body:has(main [data-theme='dark']) [data-legacy-chrome] { display: none }`)
 * masquant l'en-tête et le pied de page hérités que `layout.tsx` rend pour les
 * pages claires. Résultat : un visiteur venu d'un appel à l'action de l'accueil
 * refaite atterrissait sur l'ancienne identité — menu « Nettoyage automobile ·
 * Réalisations · Tarifs · Journal · À propos », bouton laiton « Discuter sur
 * WhatsApp » — c'est-à-dire sur une navigation qui ne correspond plus au site,
 * et qui pointe vers des pages volontairement retirées de la navigation.
 *
 * S'y ajoutaient les symptômes d'un module CSS de juillet appliqué sur un fond
 * sombre : encadrés fantômes autour du titre et du chapô, sur-titres et titres
 * de section en gris trop faible pour tenir le contraste demandé (WCAG 2.2 AA,
 * 4,5:1), et une grille de trois cartes identiques — exactement la composition
 * que `docs/03-direction-artistique.md` §12 écarte.
 *
 * **La page n'avait aucune sortie.** Elle s'arrêtait après « Déroulement ». Une
 * page atteinte depuis un appel à l'action principal et qui ne propose rien
 * ensuite est un cul-de-sac : `CtaSection` la ferme désormais, comme toutes les
 * autres pages de la charte.
 *
 * **Le contenu, lui, n'a pas bougé.** Titre, chapô, les trois rôles du site,
 * les sept éléments pris en charge et les quatre étapes viennent tous, mot pour
 * mot, de `content/web-design.ts`. Rien n'a été réécrit, rien n'a été ajouté :
 * la refonte est visuelle et structurelle, pas rédactionnelle.
 *
 * **Halos** : `DarkHero` en entrée, `CtaSection` en sortie, soit deux — le
 * budget documenté en §1.7 (deux ou trois par page, l'entrée et la sortie).
 */

/**
 * Les sept éléments pris en charge, en liste éditoriale plutôt qu'en cartes.
 *
 * Sept cartes feraient une grille, et la grille de cartes identiques est
 * écartée par la charte. Des lignes séparées par des filets, sur deux colonnes,
 * disent la même chose sans transformer une énumération en catalogue — et ne
 * répètent pas la numérotation, qui appartient aux quatre étapes plus bas.
 */
function IncludedWorkSection() {
  return (
    <Section labelledBy="included-title" className="border-t border-hairline py-24">
      <SectionHead
        eyebrow="Conception"
        title="Ce que nous prenons en charge."
        lead="Le périmètre exact dépend du projet. Chaque élément retenu doit servir la compréhension, l’usage ou la prise de contact."
        id="included-title"
      />

      <ul className="mx-auto grid max-w-[60rem] gap-x-12 sm:grid-cols-2">
        {includedWork.map((item) => (
          <li
            key={item}
            className="border-t border-hairline py-4 text-[0.9375rem] leading-[1.55] text-muted"
          >
            {item}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export default function WebDesignPage() {
  return (
    <div data-theme="dark" className="bg-ink">
      <JsonLd data={webDesignService()} />
      <JsonLd
        data={breadcrumbList([
          { name: 'Accueil', path: '/' },
          { name: 'Création de site web', path: '/creation-site-web' },
        ])}
      />

      <DarkHeader />

      {/* `DarkHero` plutôt que `SectionHead` : c'est lui qui porte le `<h1>` de
          la page. `SectionHead` rend un `<h2>` — correct pour les sections,
          insuffisant pour une ouverture, et une page sans `<h1>` contredit
          autant la charte que le référencement. */}
      <DarkHero
        eyebrow={webDesignPage.eyebrow}
        title={webDesignPage.title}
        subtitle={webDesignPage.lead}
        ctaLabel="Décrire mon projet"
        ctaHref="/contact"
        secondaryLabel="Estimer mon site"
        secondaryHref="/estimation"
      />

      <WhyUsSection
        eyebrow="Le rôle du site"
        title="Trois choses doivent rester évidentes."
        items={expectedOutcomes}
      />

      <IncludedWorkSection />

      <JourneySection
        eyebrow="Déroulement"
        title="Un projet construit dans le bon ordre."
        steps={projectSteps}
      />

      {/* La sortie qui manquait. Le vocabulaire reprend la première étape du
          déroulé ci-dessus (« Cadrer ») plutôt que d'annoncer un résultat :
          aucun chiffre, aucun délai, aucune promesse que le projet ne tient
          pas encore. */}
      <CtaSection
        eyebrow="Parlons-en"
        title="Tout commence par un cadrage."
        body="Dites-nous ce que le site doit expliquer, à qui il s’adresse et l’action attendue. On regarde ensemble ce que ça implique avant d’engager quoi que ce soit."
        primary={{ href: '/contact', label: 'Décrire mon projet' }}
        secondary={{ href: '/estimation', label: 'Estimer mon site' }}
      />

      <DarkFooter />
    </div>
  );
}
