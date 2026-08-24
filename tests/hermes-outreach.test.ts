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
  emailSource: 'site_web',
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

  it('dit d’où vient l’adresse — cas relevée sur le site du prospect', () => {
    /*
     * Article 14 du RGPD : les données n'ont pas été obtenues auprès de la
     * personne, donc l'origine doit lui être communiquée. C'est une obligation,
     * pas une politesse.
     */
    expect(message.text).toMatch(/répertoire\s+public des entreprises/);
    expect(message.text).toMatch(/publiée sur votre site/);
  });

  it('dit d’où vient l’adresse — cas portée directement par OpenStreetMap', () => {
    /*
     * Ajouté le 24/08/2026 avec l'enrichissement OSM (migration 021). Une
     * adresse portée par le tag `email` d'OpenStreetMap n'a jamais été vue
     * par Qualifyr sur le site du prospect — dire « publiée sur votre site »
     * serait donc faux, même si un contributeur OSM l'y a peut-être recopiée
     * à l'origine. La formulation doit changer avec la source, jamais rester
     * générique par commodité.
     */
    const osmMessage = composeMessage(CAMPAIGN, { ...CANDIDATE, emailSource: 'osm_tag' }, url);
    expect(osmMessage.text).toMatch(/répertoire\s+public des entreprises/);
    expect(osmMessage.text).toMatch(/données cartographiques publiques d.OpenStreetMap/);
    expect(osmMessage.text).not.toMatch(/publiée sur votre site/);
  });

  it('les deux formulations d’origine sont mutuellement exclusives', () => {
    const siteWeb = composeMessage(CAMPAIGN, { ...CANDIDATE, emailSource: 'site_web' }, url);
    const osmTag = composeMessage(CAMPAIGN, { ...CANDIDATE, emailSource: 'osm_tag' }, url);
    expect(siteWeb.text).toMatch(/publiée sur votre site/);
    expect(siteWeb.text).not.toMatch(/OpenStreetMap/);
    expect(osmTag.text).toMatch(/OpenStreetMap/);
    expect(osmTag.text).not.toMatch(/publiée sur votre site/);
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

  it('ne renvoie jamais deux fois le même e-mail dans un même lot ni un e-mail déjà contacté par la campagne', () => {
    /*
     * Ajouté le 24/08/2026. Depuis l'enrichissement OSM, deux prospects
     * distincts peuvent légitimement partager une adresse (une franchise,
     * un groupe). Sans dédoublonnage ici, `nextCandidates` renverrait les
     * deux et la boucle d'envoi (protégée seulement par l'unicité
     * (campaign_id, prospect_id), pas par l'adresse) leur écrirait à tous
     * les deux — deux messages identiques dans la même boîte le même jour,
     * exactement le profil qui déclenche un signalement.
     */
    expect(outreach).toContain("from('hermes_messages')");
    expect(outreach).toContain("eq('campaign_id', campaignId)");
    expect(outreach).toContain('usedEmails.has(email)');
    expect(outreach, 'lecture ratée des envois passés doit interdire, pas autoriser').toMatch(
      /if \(sentError\) return \[\];/,
    );
  });
});

describe('réservation avant envoi', () => {
  const ROOT = process.cwd();
  const route = readFileSync(join(ROOT, 'src/app/api/agent/outreach/route.ts'), 'utf-8');
  const migration = readFileSync(
    join(ROOT, 'supabase/migrations/019_hermes_messages_pending.sql'),
    'utf-8',
  );

  /*
   * Le défaut corrigé : la ligne `hermes_messages` n'était écrite qu'après
   * le retour de Resend. Un processus tué entre l'envoi confirmé et cette
   * écriture laissait `remainingQuota` sous-compter la journée et
   * `agent_prospects.contacted_at` vide — le prospect redevenait candidat et
   * recevait un second message. La réservation en `pending`, avant l'appel à
   * Resend, ferme ce trou : l'index unique (campaign_id, prospect_id) de la
   * migration 016 devient un verrou atomique.
   */

  it('réserve la ligne hermes_messages avant tout appel à Resend', () => {
    const reserve = route.indexOf("status: 'pending'");
    const send = route.indexOf('resend.emails.send');
    expect(reserve).toBeGreaterThanOrEqual(0);
    expect(reserve).toBeLessThan(send);
  });

  it('pose contacted_at à la réservation, avant l’envoi — pas après', () => {
    const contacted = route.indexOf("update({ contacted_at: new Date().toISOString() })");
    const send = route.indexOf('resend.emails.send');
    expect(contacted).toBeGreaterThanOrEqual(0);
    expect(contacted).toBeLessThan(send);
  });

  it('la vérification de suppression reste avant la réservation', () => {
    // Le test existant verrouille déjà isSuppressed avant l'envoi ; celui-ci
    // verrouille qu'aucun engagement (réservation comprise) ne précède la
    // vérification.
    const suppressionCheck = route.indexOf('isSuppressed(candidate.email)');
    const reserve = route.indexOf("status: 'pending'");
    expect(suppressionCheck).toBeGreaterThanOrEqual(0);
    expect(suppressionCheck).toBeLessThan(reserve);
  });

  it('traite un conflit d’unicité comme une réservation déjà prise, jamais comme une erreur à retenter', () => {
    expect(route).toContain("reserveError.code === '23505'");
  });

  it('n’envoie pas si la réservation échoue, connue ou non', () => {
    // Les deux branches de `reserveError` doivent aboutir à `continue` sans
    // jamais atteindre `resend.emails.send` — une réservation qu'on ne peut
    // pas écrire est une trace qu'on ne pourra pas produire.
    const reserveErrorBlock = route.slice(
      route.indexOf('if (reserveError)'),
      route.indexOf('// 4. Sort le prospect'),
    );
    expect(reserveErrorBlock).not.toContain('resend.emails.send');
    expect((reserveErrorBlock.match(/continue;/g) ?? []).length).toBe(2);
  });

  it('ne relit ni ne rejoue jamais une ligne pending existante', () => {
    // Une ligne `pending` signifie « on ne sait pas si le message est
    // parti » : la rejouer réintroduirait le double envoi que la réservation
    // ferme. La seule requête qui filtre sur ce statut est le diagnostic
    // (`head: true` — un décompte, jamais des lignes récupérées pour être
    // retraitées) ; aucune autre ne doit exister.
    const matches = [...route.matchAll(/\.eq\(\s*['"]status['"],\s*['"]pending['"]\s*\)/g)];
    expect(matches).toHaveLength(1);

    const [match] = matches;
    const index = match!.index!;
    const context = route.slice(Math.max(0, index - 150), index);
    expect(context).toContain('head: true');
  });

  it('inspecte le retour d’erreur de chacune des quatre écritures', () => {
    // Réservation, contacted_at, et les deux finalisations (failed / sent) :
    // plus un seul insert ou update sans lecture de `error`.
    expect(route).toContain('error: reserveError');
    expect(route).toContain('error: contactedError');
    expect(route).toContain('error: failUpdateError');
    expect(route).toContain('error: sentUpdateError');
    expect(route).toContain('if (contactedError)');
    expect(route).toContain('if (failUpdateError)');
    expect(route).toContain('if (sentUpdateError)');
  });

  it('surface le nombre de réservations orphelines de plus d’une heure', () => {
    // Une ligne `pending` ancienne n'est jamais rejouée automatiquement,
    // mais son décompte doit rester visible : c'est la seule façon
    // d'apprendre qu'un passage a été tué en route autrement que par un
    // client.
    expect(route).toContain('stalePendingCount');
    expect(route).toContain("eq('status', 'pending')");
  });

  it('migration 019 : le défaut de statut devient pending, jamais sent', () => {
    // Un défaut `sent` sur une table qui sert de preuve d'envoi est un piège
    // en soi : l'insertion la plus distraite doit produire l'état le plus
    // prudent.
    expect(migration).toContain("alter column status set default 'pending'");
    expect(migration).toMatch(
      /check \(status in \('pending', 'sent', 'failed', 'bounced', 'complained'\)\)/,
    );
  });

  it('migration 019 est idempotente', () => {
    expect(migration).toContain('drop constraint if exists hermes_messages_status_known');
  });
});
