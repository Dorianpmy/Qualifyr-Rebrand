import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildLlmsText, geoFacts } from '@/content/geo';
import { pageMeta, sitemapRoutes } from '@/content/site';
import { automotiveVertical } from '@/content/verticals';
import {
  faqPage,
  organization,
  verticalService,
  webPage,
} from '@/lib/structured-data';

/*
 * Ce fichier datait de l'ancienne page d'accueil (charte agence : vidéo de
 * fond, section « SW Car Cleaning », lien direct vers /estimation) et de la
 * verticale conciergerie (page, simulateur, contenu structuré), toutes deux
 * retirées depuis — la page d'accueil actuelle vit sur la charte « Dark
 * Minimalist » (voir la documentation en tête de `src/app/page.tsx`) et ne
 * porte plus ces éléments par choix de conception, pas par régression.
 * Les assertions qui vérifiaient la présence de ce contenu précis sur la page
 * d'accueil ont été retirées ; celles qui vérifient encore des pages ou
 * contenus toujours en place ont été conservées telles quelles.
 *
 * Mise à jour du 17/08/2026 (repositionnement SaaS-first) : `vitest`
 * fonctionne bien dans ce sandbox (le commentaire précédent, qui affirmait le
 * contraire, était erroné) — cette exécution a révélé que plusieurs
 * assertions ci-dessous n'avaient en réalité jamais été mises à jour après le
 * renommage « detailer/detailing → laveur auto » et la suppression de la
 * page /realisations/sw-car-cleaning (toutes deux antérieures à cette
 * session). Corrigées ici pour refléter le code source réel, vérifié par
 * lecture directe des fichiers concernés.
 */

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const source = (path: string) => readFileSync(`${projectRoot}${path}`, 'utf8');

describe('architecture commerciale', () => {
  const homepage = source('src/app/page.tsx');
  const estimation = source('src/app/estimation/page.tsx');

  it('garde le configurateur et les prix hors de la page d’accueil', () => {
    expect(homepage).not.toContain('OfferConfigurator');
    expect(homepage).not.toMatch(/setupPrice|monthlyPrice|formatMoney/);
  });

  it('ne contient plus de section laboratoire', () => {
    expect(homepage).not.toContain('CreativeLab');
    expect(homepage).not.toContain('id="laboratoire"');
  });

  it('publie une route estimation canonique qui réutilise le configurateur', () => {
    expect(estimation).toContain('<OfferConfigurator showIntro={false} />');
    expect(pageMeta['/estimation'].title).toBe('Estimation budget site laveur auto — Qualifyr');
    expect(pageMeta['/estimation'].description).toBe(
      'Orientation claire et fourchette de budget indicative en quelques minutes, avant le premier échange.',
    );
    expect(sitemapRoutes).toContain('/estimation');
  });

  it('garde les redirections de campagne hors du sitemap et des robots publics', () => {
    const robots = source('src/app/robots.ts');
    expect(sitemapRoutes.some((route) => route.startsWith('/go/'))).toBe(false);
    expect(robots).toContain("'/go/'");
  });
});

describe('pages métier', () => {
  const automotivePage = source('src/app/nettoyage-automobile/page.tsx');

  it('publie la verticale officielle avec le composant partagé', () => {
    // La page vit sur la charte « Dark Minimalist » (`DarkHero`, `CardsSection`,
    // `JourneySection`, `FaqSection`…) et non sur l'ancien `VerticalServicePage`
    // (non importé nulle part, voir le commentaire sur `automotiveVertical.proof`
    // dans `content/verticals.ts`) : on vérifie que le contenu réel de
    // `automotiveVertical` est bien branché, pas un nom de composant obsolète.
    expect(automotivePage).toContain('automotiveVertical');
    expect(automotivePage).toContain("faqPage('/nettoyage-automobile', faq)");
    expect(sitemapRoutes).toContain('/nettoyage-automobile');
    expect(sitemapRoutes).not.toContain('/conciergerie');
  });

  it('utilise les métadonnées commerciales validées', () => {
    expect(pageMeta['/nettoyage-automobile']).toMatchObject({
      title: 'Site pour laveurs auto à domicile — plus de réservations',
      description:
        'Prestations claires, tarifs par véhicule, réservation simple. Pour les laveurs auto qui veulent moins de messages Instagram et plus de rendez-vous.',
    });
  });

  it('décrit l’expertise avec un Service et la FAQ réellement affichée', () => {
    expect(verticalService(automotiveVertical)).toMatchObject({
      '@type': 'Service',
      name: 'Création de site internet pour laveurs auto à domicile',
      category: ['Nettoyage automobile mobile', 'Lavage auto à domicile'],
      mainEntityOfPage: {
        '@id': 'https://qualifyragence.com/nettoyage-automobile#webpage',
      },
    });
    expect(webPage('/nettoyage-automobile')).toMatchObject({
      mainEntity: {
        '@id': 'https://qualifyragence.com/nettoyage-automobile#service',
      },
    });
    expect(faqPage(automotiveVertical.route, automotiveVertical.faq)).toMatchObject({
      about: {
        '@id': 'https://qualifyragence.com/nettoyage-automobile#service',
      },
      mainEntity: expect.arrayContaining([expect.objectContaining({ '@type': 'Question' })]),
    });
    expect(faqPage(automotiveVertical.route, automotiveVertical.faq).mainEntity).toHaveLength(6);
    // `faq` est `automotiveVertical.faq` déstructuré localement dans la page —
    // le texte source littéral ne répète pas le nom complet.
    expect(automotivePage).toContain("faqPage('/nettoyage-automobile', faq)");
  });

  it('ne revendique aucun résultat chiffré ou témoignage sans preuve publiée', () => {
    // `kind: 'concept'` — pas `'real'` — tant qu'aucune réalisation vraie
    // n'est republiée : voir le commentaire sur `proof` dans
    // `content/verticals.ts`. C'est le choix honnête, pas une régression.
    expect(automotiveVertical.proof.kind).toBe('concept');
    expect(JSON.stringify(automotiveVertical)).not.toMatch(/\d+\s?%|témoignage|clients satisfaits/i);
  });
});

describe('lisibilité pour les moteurs génératifs', () => {
  const llms = buildLlmsText();
  const robots = source('src/app/robots.ts');

  it('décrit Qualifyr et son expertise sans ajouter de preuve artificielle', () => {
    expect(geoFacts.specializations.length).toBeGreaterThan(0);
    expect(llms).toContain('https://qualifyragence.com/nettoyage-automobile');
    expect(llms).not.toContain('https://qualifyragence.com/conciergerie');
    // La page « SW Car Cleaning » a été retirée du site (P0, session
    // précédente) : le résumé GEO ne doit plus la citer.
    expect(llms).not.toContain('SW Carcleaning');
    expect(llms).not.toContain('laboratoire');
    // « conciergerie » reste présent une fois, dans l'espace négatif
    // (« Qualifyr n'est PAS un outil de conciergerie ») — disqualifier
    // explicitement ce secteur aide un lecteur automatique à ne pas
    // mal classer Qualifyr. Ce qui compte est qu'il n'apparaisse jamais en
    // dehors de cette phrase de négation.
    expect(llms.match(/conciergerie/gi)?.length).toBe(1);
    expect(llms).toContain('SaaS');
  });

  it('rend l’expertise explicite dans l’entité Organization', () => {
    expect(organization().knowsAbout).toEqual(
      expect.arrayContaining(['Nettoyage automobile mobile', 'Detailing automobile']),
    );
    expect(organization().knowsAbout).not.toContain('Conciergeries');
  });

  it('autorise explicitement les principaux robots concernés en production', () => {
    expect(robots).toContain("userAgent: 'OAI-SearchBot'");
    expect(robots).toContain("userAgent: 'PerplexityBot'");
    expect(robots).toContain("userAgent: 'Google-Extended'");
  });
});

describe('laboratoire supprimé', () => {
  const homepage = source('src/app/page.tsx');
  const navigation = source('src/content/navigation.ts');
  const siteContent = source('src/content/site.ts');
  const types = source('src/types/index.ts');

  it('supprime le composant, la route et le contenu dédiés', () => {
    expect(() => source('src/app/laboratoire/page.tsx')).toThrow();
    expect(() => source('src/components/editorial/CreativeLab.tsx')).toThrow();
    expect(() => source('src/content/creative-lab.ts')).toThrow();
  });

  it('ne laisse aucune référence dans la navigation, les métadonnées ou les types', () => {
    expect(homepage).not.toContain('CreativeLab');
    expect(navigation).not.toContain('laboratoire');
    expect(siteContent).not.toContain('/laboratoire');
    expect(types).not.toContain("'/laboratoire'");
    expect(sitemapRoutes).not.toContain('/laboratoire');
  });
});
