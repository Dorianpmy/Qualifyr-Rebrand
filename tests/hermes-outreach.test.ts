import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { composeMessage, fillTemplate, type Campaign, type OutreachCandidate } from '../src/lib/agent/outreach-message';

/**
 * Hermès — ce qui part, et ce qui ne doit jamais partir.
 *
 * **Les fonctions pures sont testées ; les fonctions qui touchent la base ne
 * le sont pas ici.** `remainingQuota`, `isSuppressed` et `campaignCanSend`
 * demandent une base PostgreSQL, absente de cet environnement. Les couvrir
 * avec des doublures reviendrait à tester les doublures : leur comportement
 * critique — « en cas d'erreur, on ne part pas » — est vérifié par lecture du
 * code dans le dernier bloc, ce qui est moins bon qu'un test d'intégration,
 * mais bien meilleur que rien. Le jour où une base de test existe, ces
 * assertions par lecture doivent être remplacées.
 *
 * Le premier bloc, lui, teste ce que reçoit réellement le destinataire — donc
 * la partie qui engage juridiquement.
 */

const CAMPAIGN: Campaign = {
  id: 'c1',
  ownerId: 'u1',
  senderName: 'Marc Dupuis — Lavage Auto Avignon',
  replyToEmail: 'marc@lavage-avignon.fr',
  subject: 'Entretien de vos véhicules, {{entreprise}}',
  body: 'Bonjour,\n\nJe suis basé à {{ville}} et je lave les véhicules de flotte sur place.\n\nSi cela vous intéresse, je peux passer voir vos véhicules.',
  dailyQuota: 15,
  pausedAt: null,
  suspendedAt: null,
};

const CANDIDATE: OutreachCandidate = {
  prospectId: 'p1',
  email: 'contact@garage-durand.fr',
  businessName: 'Garage Durand',
  city: 'Avignon',
  unsubscribeToken: 'tok-123',
};

describe('gabarit', () => {
  it('remplace les deux variables prévues', () => {
    const result = fillTemplate('Bonjour {{entreprise}}, à {{ville}}', {
      businessName: 'Garage Durand',
      city: 'Avignon',
    });
    expect(result).toBe('Bonjour Garage Durand, à Avignon');
  });

  it('remplace toutes les occurrences, pas seulement la première', () => {
    /*
     * `String.replace` avec une chaîne ne remplace que la première occurrence
     * — piège classique. Un professionnel qui écrit deux fois `{{entreprise}}`
     * verrait la seconde partir telle quelle chez le destinataire.
     */
    const result = fillTemplate('{{entreprise}} — {{entreprise}}', {
      businessName: 'Garage Durand',
      city: null,
    });
    expect(result).toBe('Garage Durand — Garage Durand');
  });

  it('produit une phrase correcte quand la ville est inconnue', () => {
    // Une variable vide donnerait « je suis basé à  et je lave » : la faute se
    // voit immédiatement et décrédibilise l'expéditeur.
    const result = fillTemplate('basé à {{ville}}', { businessName: 'X', city: null });
    expect(result).toBe('basé à votre secteur');
    expect(result).not.toContain('{{');
  });

  it('ne laisse jamais de variable non résolue dans le message final', () => {
    const message = composeMessage(CAMPAIGN, { ...CANDIDATE, city: null }, 'https://x.test/u/1');
    expect(message.subject).not.toContain('{{');
    expect(message.text).not.toContain('{{');
  });
});

describe('message envoyé', () => {
  const url = 'https://qualifyragence.com/desinscription/tok-123';
  const message = composeMessage(CAMPAIGN, CANDIDATE, url);

  it('porte le lien de désinscription', () => {
    // Sans ce lien, l'opposition n'est pas exerçable : la prospection cesse
    // d'être licite, et le destinataire clique sur « indésirable » à la place.
    expect(message.text).toContain(url);
  });

  it('dit d’où vient l’adresse', () => {
    /*
     * Article 14 du RGPD : les données n'ont pas été obtenues auprès de la
     * personne, donc l'origine doit lui être communiquée. C'est une obligation,
     * pas une politesse.
     */
    expect(message.text).toMatch(/répertoire\s+public des entreprises/);
    expect(message.text).toMatch(/publiée sur votre site/);
  });

  it('identifie l’expéditeur par son nom', () => {
    expect(message.text).toContain(CAMPAIGN.senderName);
  });

  it('garde le texte du professionnel avant le bloc obligatoire', () => {
    // L'ordre compte : le message utile d'abord, les mentions ensuite.
    const bodyIndex = message.text.indexOf('Je suis basé');
    const footerIndex = message.text.indexOf('Vous recevez ce message');
    expect(bodyIndex).toBeGreaterThanOrEqual(0);
    expect(footerIndex).toBeGreaterThan(bodyIndex);
  });
});

describe('garde-fous du code', () => {
  const ROOT = process.cwd();
  const outreach = readFileSync(join(ROOT, 'src/lib/agent/outreach.ts'), 'utf-8');
  const route = readFileSync(join(ROOT, 'src/app/api/agent/outreach/route.ts'), 'utf-8');

  it('ne part jamais quand une vérification échoue', () => {
    /*
     * Ces trois valeurs de repli sont ce qui empêche un incident technique de
     * se transformer en envoi massif. Les inverser — quota complet par défaut,
     * adresse autorisée par défaut — serait indétectable en lecture rapide et
     * catastrophique en production.
     */
    expect(outreach, 'quota illisible doit valoir zéro').toMatch(/if \(error\) return 0;/);
    expect(outreach, 'suppression invérifiable doit valoir interdit').toMatch(
      /if \(error\) return true;/,
    );
  });

  it('vérifie l’abonnement à chaque passage', () => {
    // Une capacité mise en cache laisserait un compte résilié continuer à
    // prospecter jusqu'au prochain redéploiement.
    expect(outreach).toContain("canAccess(entitlement, 'agent.prospecting')");
  });

  it('protège la route par le secret du planificateur', () => {
    // De toutes les routes du projet, c'est celle où une absence de protection
    // coûterait le plus cher : n'importe qui enverrait au nom d'un client.
    expect(route).toContain("process.env['CRON_SECRET']");
    expect(route).toMatch(/status: 401/);
  });

  it('n’envoie pas sans domaine d’expédition dédié', () => {
    /*
     * `HERMES_FROM_EMAIL` doit être distinct du domaine transactionnel. Un
     * repli sur `BOOKING_FROM_EMAIL` ferait porter à la prospection la
     * réputation qui livre les factures et les confirmations.
     */
    expect(route).toContain("process.env['HERMES_FROM_EMAIL']");
    expect(route, 'aucun repli sur le domaine transactionnel').not.toContain(
      'BOOKING_FROM_EMAIL',
    );
  });

  it('pose les en-têtes de désinscription exigés par Gmail et Yahoo', () => {
    expect(route).toContain('List-Unsubscribe');
    expect(route).toContain('List-Unsubscribe-Post');
  });

  it('vérifie la liste de suppression juste avant l’envoi', () => {
    // Et non à la constitution de la file : entre les deux, quelqu'un a pu se
    // désinscrire.
    const suppressionCheck = route.indexOf('isSuppressed(candidate.email)');
    const send = route.indexOf('resend.emails.send');
    expect(suppressionCheck).toBeGreaterThanOrEqual(0);
    expect(suppressionCheck).toBeLessThan(send);
  });

  it('restreint les prospects au périmètre du compte', () => {
    /*
     * Une première version de `nextCandidates` interrogeait `agent_prospects`
     * sans filtre : la campagne d'un professionnel aurait écrit aux entreprises
     * recensées par un autre. Le test verrouille le filtrage par e-mail du
     * compte.
     */
    expect(outreach).toContain("from('agent_zones')");
    expect(outreach).toContain("ilike('email', ownerEmail)");
    expect(outreach).toContain("in('zone_id', zoneIds)");
  });
});
