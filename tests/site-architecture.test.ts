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
 * Chaque changement ci-dessous a été vérifié à la main contre le code source
 * actuel (`grep`), faute de pouvoir faire tourner la suite de tests dans cet
 * environnement pour le confirmer par exécution — `vitest` y échoue sur un
 * binding natif manquant (`@rolldown/binding-linux-arm64-gnu`), un problème
 * d'environnement sans rapport avec le code. À faire tourner sur un poste où
 * `npm test` fonctionne avant de considérer ce fichier définitivement à jour.
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
    expect(pageMeta['/estimation'].title).toBe('Estimation budget site detailing — Qualifyr');
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
    expect(automotivePage).toContain('<VerticalServicePage content={automotiveVertical} />');
    expect(sitemapRoutes).toContain('/nettoyage-automobile');
    expect(sitemapRoutes).not.toContain('/conciergerie');
  });

  it('utilise les métadonnées commerciales validées', () => {
    expect(pageMeta['/nettoyage-automobile']).toMatchObject({
      title: 'Site pour detailing et nettoyage auto — plus de réservations',
      description:
        'Prestations claires, tarifs par véhicule, réservation simple. Pour les detailers qui veulent moins de messages Instagram et plus de rendez-vous.',
    });
  });

  it('décrit l’expertise avec un Service et la FAQ réellement affichée', () => {
    expect(verticalService(automotiveVertical)).toMatchObject({
      '@type': 'Service',
      name: 'Création de site internet pour nettoyage automobile et detailing',
      category: ['Nettoyage automobile mobile', 'Detailing à domicile'],
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
    expect(automotiveVertical.proof.kind).toBe('real');
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
    expect(llms).toContain('SW Carcleaning');
    expect(llms).not.toContain('laboratoire');
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
