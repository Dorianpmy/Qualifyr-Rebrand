import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
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

  it('ne contient plus de section laboratoire et garde un lien vers l’estimation', () => {
    expect(homepage).not.toContain('CreativeLab');
    expect(homepage).not.toContain('id="laboratoire"');
    expect(homepage).toContain('href="/estimation"');
  });

  it('publie une route estimation canonique qui réutilise le configurateur', () => {
    expect(estimation).toContain('<OfferConfigurator showIntro={false} />');
    expect(pageMeta['/estimation'].title).toBe('Estimation de votre projet de site — Qualifyr');
    expect(pageMeta['/estimation'].description).toBe(
      'Obtenez une orientation claire et une fourchette de budget indicative en quelques minutes, avant même le premier échange.',
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
      title: 'Site pour detailing et nettoyage auto — plus de réservations',
      description:
        'Vos prestations présentées clairement, vos tarifs par type de véhicule et une prise de rendez-vous simple. Pour les detailers qui veulent moins de DM et plus de RDV.',
    });
    expect(pageMeta['/conciergerie']).toMatchObject({
      title: 'Site pour conciergerie — attirer et convaincre des propriétaires',
      description:
        'Un site qui rassure les propriétaires, met en avant vos garanties et qualifie chaque demande. Pour les conciergeries qui veulent signer plus de mandats.',
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
    expect(faqPage(automotiveVertical.route, automotiveVertical.faq).mainEntity).toHaveLength(6);
    expect(faqPage(conciergeVertical.route, conciergeVertical.faq).mainEntity).toHaveLength(6);
    expect(automotivePage).toContain("faqPage('/nettoyage-automobile', automotiveVertical.faq)");
    expect(conciergePage).toContain("faqPage('/conciergerie', conciergeVertical.faq)");
  });

  it('distingue la preuve réelle du simulateur en démonstration et ne revendique aucun résultat', () => {
    expect(automotiveVertical.proof.kind).toBe('real');
    expect(conciergeVertical.proof.kind).toBe('concept');
    expect(conciergeVertical.proof.eyebrow).toContain('Simulateur en ligne');
    expect(conciergeVertical.proof.link).toBe('/simulateur-revenus-locatifs');
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
    expect(llms).not.toContain('laboratoire');
    expect(llms).toContain('Aucun avis, résultat chiffré ou client supplémentaire n’est revendiqué sans preuve publiée.');
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
