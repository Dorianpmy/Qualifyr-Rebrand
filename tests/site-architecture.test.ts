import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { creativeLab } from '@/content/creative-lab';
import { buildLlmsText, geoFacts } from '@/content/geo';
import { pageMeta, sitemapRoutes } from '@/content/site';
import { automotiveVertical, conciergeVertical } from '@/content/verticals';
import {
  faqPage,
  organization,
  verticalService,
  webPage,
} from '@/lib/structured-data';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const source = (path: string) => readFileSync(`${projectRoot}${path}`, 'utf8');

describe('architecture commerciale', () => {
  const homepage = source('src/app/page.tsx');
  const estimation = source('src/app/estimation/page.tsx');

  it('garde le configurateur et les prix hors de la page d’accueil', () => {
    expect(homepage).not.toContain('OfferConfigurator');
    expect(homepage).not.toMatch(/setupPrice|monthlyPrice|formatMoney/);
  });

  it('présente SW Car Cleaning une seule fois et pointe vers son étude', () => {
    expect(homepage.match(/<h2>SW Car Cleaning<\/h2>/g)).toHaveLength(1);
    expect(homepage).toContain('href="/realisations/sw-car-cleaning"');
  });

  it('affiche le laboratoire compact et un lien vers l’estimation', () => {
    expect(homepage).toContain('<CreativeLab />');
    expect(creativeLab.items).toHaveLength(3);
    expect(creativeLab.items.some((item) => item.title === 'SW Car Cleaning')).toBe(false);
    expect(homepage).toContain('href="/estimation"');
  });

  it('publie une route estimation canonique qui réutilise le configurateur', () => {
    expect(estimation).toContain('<OfferConfigurator showIntro={false} />');
    expect(pageMeta['/estimation'].title).toBe('Estimation de projet | Qualifyr');
    expect(pageMeta['/estimation'].description).toBe(
      'Obtenez une première orientation et une estimation indicative avant un échange avec Qualifyr.',
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
  const conciergePage = source('src/app/conciergerie/page.tsx');
  const homepage = source('src/app/page.tsx');

  it('publie les deux seules verticales officielles avec le composant partagé', () => {
    expect(automotivePage).toContain('<VerticalServicePage content={automotiveVertical} />');
    expect(conciergePage).toContain('<VerticalServicePage content={conciergeVertical} />');
    expect(sitemapRoutes).toContain('/nettoyage-automobile');
    expect(sitemapRoutes).toContain('/conciergerie');
  });

  it('utilise les métadonnées commerciales validées', () => {
    expect(pageMeta['/nettoyage-automobile']).toMatchObject({
      title: 'Création de site pour nettoyage auto et detailing | Qualifyr',
      description:
        'Qualifyr crée des sites internet pour le nettoyage automobile mobile et le detailing, afin de clarifier les offres et faciliter la prise de rendez-vous.',
    });
    expect(pageMeta['/conciergerie']).toMatchObject({
      title: 'Création de site internet pour conciergerie | Qualifyr',
      description:
        'Qualifyr crée des sites internet pour les conciergeries afin de présenter leurs services, rassurer leurs prospects et mieux qualifier chaque demande.',
    });
  });

  it('décrit chaque expertise avec un Service et la FAQ réellement affichée', () => {
    expect(verticalService(automotiveVertical)).toMatchObject({
      '@type': 'Service',
      name: 'Création de site internet pour nettoyage automobile et detailing',
      category: ['Nettoyage automobile mobile', 'Detailing à domicile'],
      mainEntityOfPage: {
        '@id': 'https://qualifyragence.com/nettoyage-automobile#webpage',
      },
    });
    expect(verticalService(conciergeVertical)).toMatchObject({
      '@type': 'Service',
      name: 'Création de site internet pour conciergerie',
      category: ['Conciergeries'],
      mainEntityOfPage: {
        '@id': 'https://qualifyragence.com/conciergerie#webpage',
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
    expect(faqPage(automotiveVertical.route, automotiveVertical.faq).mainEntity).toHaveLength(5);
    expect(faqPage(conciergeVertical.route, conciergeVertical.faq).mainEntity).toHaveLength(5);
    expect(automotivePage).toContain("faqPage('/nettoyage-automobile', automotiveVertical.faq)");
    expect(conciergePage).toContain("faqPage('/conciergerie', conciergeVertical.faq)");
  });

  it('distingue la preuve réelle du concept et ne revendique aucun résultat', () => {
    expect(automotiveVertical.proof.kind).toBe('real');
    expect(conciergeVertical.proof.kind).toBe('concept');
    expect(conciergeVertical.proof.eyebrow).toContain('Concept Qualifyr');
    expect(JSON.stringify([automotiveVertical, conciergeVertical])).not.toMatch(/\d+\s?%|témoignage|clients satisfaits/i);
  });

  it('relie la section entreprises aux deux pages métier', () => {
    expect(homepage).toContain('href={company.href}');
    expect(JSON.stringify([automotiveVertical.route, conciergeVertical.route])).toBe(
      '["/nettoyage-automobile","/conciergerie"]',
    );
  });
});

describe('lisibilité pour les moteurs génératifs', () => {
  const llms = buildLlmsText();
  const robots = source('src/app/robots.ts');

  it('décrit Qualifyr et ses deux expertises sans ajouter de preuve artificielle', () => {
    expect(geoFacts.specializations).toHaveLength(2);
    expect(llms).toContain('https://qualifyragence.com/nettoyage-automobile');
    expect(llms).toContain('https://qualifyragence.com/conciergerie');
    expect(llms).toContain('SW Carcleaning');
    expect(llms).toContain('démonstrations créatives et non des projets clients livrés');
  });

  it('rend les expertises explicites dans l’entité Organization', () => {
    expect(organization().knowsAbout).toEqual(
      expect.arrayContaining([
        'Nettoyage automobile mobile',
        'Detailing à domicile',
        'Conciergeries',
      ]),
    );
  });

  it('autorise explicitement les principaux robots concernés en production', () => {
    expect(robots).toContain("userAgent: 'OAI-SearchBot'");
    expect(robots).toContain("userAgent: 'PerplexityBot'");
    expect(robots).toContain("userAgent: 'Google-Extended'");
  });
});

describe('laboratoire sobre', () => {
  const component = source('src/components/editorial/CreativeLab.tsx');

  it('conserve une fenêtre accessible et restaure le focus', () => {
    expect(component).toContain('<dialog');
    expect(component).toContain('aria-labelledby={titleId}');
    expect(component).toContain('lastTriggerRef.current?.focus()');
  });

  it('ne contient plus d’atelier de palette ou de scénarios', () => {
    expect(component).not.toMatch(/Atelier palette|composez votre palette|scenarioChoices|orientationGoals/);
  });
});
