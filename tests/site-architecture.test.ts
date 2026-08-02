import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { creativeLab } from '@/content/creative-lab';
import { pageMeta, sitemapRoutes } from '@/content/site';
import { automotiveVertical, conciergeVertical } from '@/content/verticals';

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
      title: 'Site pour nettoyage automobile et detailing | Qualifyr',
      description:
        'Qualifyr aide les professionnels du nettoyage automobile et du detailing à clarifier leurs prestations, renforcer leur image et obtenir des demandes plus sérieuses.',
    });
    expect(pageMeta['/conciergerie']).toMatchObject({
      title: 'Site pour conciergerie | Qualifyr',
      description:
        'Qualifyr aide les conciergeries à présenter clairement leur accompagnement, inspirer confiance et guider leurs prospects vers la bonne prise de contact.',
    });
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
