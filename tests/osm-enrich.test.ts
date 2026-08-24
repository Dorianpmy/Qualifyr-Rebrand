import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

/*
 * `server-only` lève une erreur dès qu'il est importé hors d'une compilation
 * Next.js — ce que fait `osm-enrich.ts`. Neutralisé ici pour ce seul fichier
 * de test, comme dans `agent-relevance.test.ts`.
 */
vi.mock('server-only', () => ({}));

import {
  MAX_SHARED_EMAIL_ATTRIBUTIONS,
  OSM_ENRICHABLE_SEGMENTS,
  buildOverpassQuery,
  extractEmailsFromHtml,
  findContactLink,
  isUsableEmail,
} from '../src/lib/agent/osm-enrich';

/**
 * Enrichissement Hermès par OpenStreetMap.
 *
 * Les fonctions pures (requête Overpass, extraction, liste noire) sont
 * exécutées pour de vrai. `fetchOsmEstablishments` et `fetchWebsiteEmail`,
 * qui touchent le réseau, sont vérifiées par lecture de code — même principe
 * que `fetchRelevanceScores` (`relevance.ts`) ou `attemptReportSend`
 * (`agent/process`).
 */

describe('buildOverpassQuery', () => {
  it('couvre tous les codes postaux et tous les segments demandés en une seule requête', () => {
    const query = buildOverpassQuery({
      postalCodes: ['69001', '69002', '69003'],
      segments: OSM_ENRICHABLE_SEGMENTS,
    });

    expect(query).toContain('69001|69002|69003');
    expect(query).toContain('"shop"~"^(car_repair|car)$"');
    expect(query).toContain('"amenity"~"^(car_rental)$"');
    // Une seule requête, jamais une par entreprise ni par code postal.
    expect(query.match(/nwr\[/g)).toHaveLength(2); // une clause par segment demandé
  });

  it('ignore un segment sans correspondance OSM connue (vtc, flottes)', () => {
    const query = buildOverpassQuery({ postalCodes: ['69001'], segments: ['vtc', 'flottes'] });
    expect(query.match(/nwr\[/g)).toBeNull();
  });

  it('demande uniquement les tags, jamais la géométrie', () => {
    const query = buildOverpassQuery({ postalCodes: ['69001'], segments: ['concessions'] });
    expect(query).toContain('out tags;');
    expect(query).not.toContain('out center');
    expect(query).not.toContain('out geom');
  });

  it('échappe les caractères spéciaux d’un code postal pour ne pas casser la regex Overpass', () => {
    const query = buildOverpassQuery({ postalCodes: ['69.01'], segments: ['concessions'] });
    expect(query).toContain('69\\.01');
  });
});

describe('extractEmailsFromHtml', () => {
  it('trouve un mailto', () => {
    const html = '<a href="mailto:contact@garage-durand.fr">Nous écrire</a>';
    expect(extractEmailsFromHtml(html)).toContain('contact@garage-durand.fr');
  });

  it('trouve une adresse en texte brut', () => {
    const html = '<p>Contact : contact@garage-durand.fr</p>';
    expect(extractEmailsFromHtml(html)).toContain('contact@garage-durand.fr');
  });

  it('ne renvoie pas de doublons', () => {
    const html = '<a href="mailto:a@x.fr">a@x.fr</a><p>a@x.fr</p>';
    expect(extractEmailsFromHtml(html).filter((e) => e === 'a@x.fr')).toHaveLength(1);
  });

  it('renvoie une liste vide sans adresse', () => {
    expect(extractEmailsFromHtml('<p>Rien ici.</p>')).toEqual([]);
  });
});

describe('findContactLink', () => {
  it('trouve un lien dont le href contient « contact »', () => {
    const html = '<a href="/contact">Nous écrire</a>';
    expect(findContactLink(html, 'https://garage-durand.fr')).toBe('https://garage-durand.fr/contact');
  });

  it('trouve un lien dont seul le texte contient « contact »', () => {
    const html = '<a href="/nous-joindre">Contact</a>';
    expect(findContactLink(html, 'https://garage-durand.fr')).toBe(
      'https://garage-durand.fr/nous-joindre',
    );
  });

  it('ignore un lien de contact vers un autre domaine', () => {
    // Jamais suivi hors de l'origine d'origine, même pour une page de contact.
    const html = '<a href="https://autre-site.fr/contact">Contact</a>';
    expect(findContactLink(html, 'https://garage-durand.fr')).toBeNull();
  });

  it('renvoie null sans lien de contact', () => {
    const html = '<a href="/prestations">Nos prestations</a>';
    expect(findContactLink(html, 'https://garage-durand.fr')).toBeNull();
  });
});

describe('isUsableEmail', () => {
  it('accepte une adresse plausible', () => {
    expect(isUsableEmail('contact@garage-durand.fr')).toBe(true);
  });

  it('rejette une forme invalide', () => {
    expect(isUsableEmail('pas-une-adresse')).toBe(false);
  });

  it('rejette les préfixes techniques', () => {
    expect(isUsableEmail('no-reply@garage-durand.fr')).toBe(false);
    expect(isUsableEmail('postmaster@garage-durand.fr')).toBe(false);
  });

  it('rejette les domaines de la liste noire, y compris en sous-domaine', () => {
    expect(isUsableEmail('errors@sentry.io')).toBe(false);
    expect(isUsableEmail('x@o123.ingest.sentry.io')).toBe(false);
    expect(isUsableEmail('privacy@domainsbyproxy.com')).toBe(false);
  });

  it('n’exclut pas un fournisseur grand public légitime pour un petit commerce', () => {
    // Beaucoup d'artisans utilisent une adresse Gmail/Orange comme adresse
    // professionnelle : ce n'est pas un artefact technique.
    expect(isUsableEmail('garage.durand@gmail.com')).toBe(true);
  });
});

describe('MAX_SHARED_EMAIL_ATTRIBUTIONS', () => {
  it('reste une dizaine — au-delà, une adresse partagée devient un artefact de gabarit', () => {
    expect(MAX_SHARED_EMAIL_ATTRIBUTIONS).toBe(10);
  });
});

describe('garde-fous du code — accès réseau', () => {
  const ROOT = process.cwd();
  const source = readFileSync(join(ROOT, 'src/lib/agent/osm-enrich.ts'), 'utf-8');

  it('n’envoie jamais d’exception hors d’un fetch réseau', () => {
    // Overpass et le fetch de site sont chacun dans leur propre try/catch,
    // avec un retour explicite en cas d’échec — jamais une exception qui
    // remonte jusqu’à la route appelante.
    expect(source.match(/} catch \{/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it('plafonne chaque fetch réseau par un timeout', () => {
    expect(source).toContain('AbortSignal.timeout(20_000)'); // Overpass
    expect(source).toContain('AbortSignal.timeout(FETCH_TIMEOUT_MS)'); // sites tiers
  });

  it('ne suit une redirection que vers le même hôte', () => {
    expect(source).toContain('next.hostname !== url.hostname');
  });

  it('n’accepte que http et https, jamais un autre protocole', () => {
    expect(source).toContain("url.protocol === 'http:' || url.protocol === 'https:'");
  });

  it('plafonne la taille de la réponse lue, indépendamment de Content-Length', () => {
    expect(source).toContain('MAX_BODY_BYTES');
    expect(source).not.toContain("headers.get('content-length')");
  });

  it('refuse d’attribuer une adresse quand la vérification du partage échoue', () => {
    // Même principe que `isSuppressed` (`outreach.ts`) : une lecture ratée
    // ne doit jamais ouvrir la voie à une attribution qu'on n'a pas pu
    // vérifier.
    expect(source).toContain('if (error) return true;');
  });
});
