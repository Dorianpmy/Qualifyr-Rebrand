import { NextResponse } from 'next/server';
import { Resend } from 'resend';

import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import {
  campaignCanSend,
  composeMessage,
  isSuppressed,
  nextCandidates,
  remainingQuota,
  suppress,
  toCampaign,
  unsubscribeUrlFor,
  type Campaign,
  type CampaignRow,
} from '@/lib/agent/outreach';

/**
 * Hermès — envoi de la prospection.
 *
 * Appelée par le planificateur. Elle traite **une campagne par passage**, dans
 * l'ordre de la plus anciennement servie : au-delà, une exécution dépasserait
 * la limite de temps d'une fonction, et surtout tous les messages d'un même
 * compte partiraient à la même seconde — ce qui est le profil d'envoi qu'un
 * filtre anti-spam repère en premier.
 *
 * **Protégée par le même secret partagé que `agent/process`.** Sans lui,
 * n'importe qui déclencherait des envois au nom de n'importe quel client.
 * C'est, de toutes les routes du projet, celle où l'absence de protection
 * coûterait le plus cher.
 *
 * ## Ce que cette route ne fait pas, délibérément
 *
 * Elle ne décide rien. Toutes les conditions d'envoi vivent dans
 * `lib/agent/outreach.ts` et y sont testables sans réseau. Ici il n'y a que la
 * boucle, l'appel au fournisseur et l'écriture du journal — si une règle
 * métier apparaît dans ce fichier, c'est qu'elle est au mauvais endroit.
 *
 * ## Pourquoi la réservation précède l'envoi
 *
 * Avant, la ligne `hermes_messages` n'était écrite qu'après le retour de
 * l'appel à Resend — `sent` en cas de succès, `failed` en cas d'erreur
 * propre. Si le processus était tué entre l'envoi confirmé par Resend et
 * cette écriture, aucune ligne n'existait : `remainingQuota` (qui compte les
 * lignes sur 24 h, voir `outreach.ts`) sous-comptait la journée et rendait du
 * quota qui n'aurait pas dû l'être, et `agent_prospects.contacted_at`
 * restait vide — le prospect redevenait candidat au passage suivant, et
 * recevait un second message de démarchage. C'est le scénario qui déclenche
 * un signalement, et un signalement porte sur le domaine d'expédition, donc
 * sur tous les comptes.
 *
 * La ligne `hermes_messages` est désormais réservée en `pending` **avant**
 * l'appel à Resend, puis finalisée en `sent`/`failed`. L'index unique
 * `(campaign_id, prospect_id)` (migration 016) devient alors un verrou
 * atomique plutôt qu'une garantie a posteriori : un conflit d'insertion
 * signifie que ce prospect est déjà réservé par un passage précédent ou
 * concurrent, et l'envoi n'a pas lieu. `agent_prospects.contacted_at` est
 * posé à la réservation, pas après l'envoi — un échec après réservation
 * (propre ou processus tué) retire donc le prospect de la file pour de bon.
 * Perdre un prospect est sans conséquence pour Hermès ; le solliciter deux
 * fois brûle le domaine de tous les comptes. Voir la migration 019.
 *
 * **Une ligne `pending` n'est jamais reprise automatiquement.** Elle signifie
 * « on ne sait pas si le message est parti » : la rejouer réintroduirait
 * exactement le double envoi que ce mécanisme ferme. Ne pas « réparer » les
 * lignes `pending` anciennes en les repassant en file — c'est délibéré.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Messages envoyés par passage, pour une campagne.
 *
 * Cinq et non le quota entier : le planificateur tourne plusieurs fois par
 * heure, donc le quota se remplit quand même dans la journée, mais les envois
 * s'étalent au lieu de partir en rafale. Un artisan qui écrirait à la main
 * n'enverrait pas quinze messages en huit secondes.
 */
const BATCH_SIZE = 5;

/**
 * Diagnostic des réservations orphelines.
 *
 * Une ligne `pending` de plus d'une heure signale un processus tué en plein
 * envoi (voir le commentaire d'en-tête) — jamais rejouée automatiquement,
 * mais son décompte doit rester visible : c'est la seule façon de
 * s'apercevoir que des passages meurent en route autrement qu'en l'apprenant
 * d'un client.
 */
const STALE_PENDING_THRESHOLD_MS = 60 * 60 * 1000;

async function countStalePending(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
): Promise<number> {
  const threshold = new Date(Date.now() - STALE_PENDING_THRESHOLD_MS).toISOString();
  const { count } = await supabase
    .from('hermes_messages')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .lt('sent_at', threshold);
  return count ?? 0;
}

export async function POST(request: Request) {
  const secret = process.env['CRON_SECRET'];
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'non autorisé' }, { status: 401 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'base indisponible' }, { status: 503 });
  }

  const apiKey = process.env['RESEND_API_KEY'];
  const from = process.env['HERMES_FROM_EMAIL'];
  if (!apiKey || !from) {
    /*
     * `HERMES_FROM_EMAIL` doit pointer vers un sous-domaine dédié
     * (`contact.qualifyragence.com`), distinct de celui des factures et des
     * confirmations de réservation. Si la prospection fait chuter la
     * réputation du domaine, le transactionnel ne doit pas tomber avec elle.
     *
     * Absence de configuration = pas d'envoi, jamais de repli sur l'adresse
     * transactionnelle : ce repli serait précisément la contamination qu'on
     * cherche à éviter.
     */
    return NextResponse.json(
      { error: 'configuration d’envoi incomplète', missing: !apiKey ? 'RESEND_API_KEY' : 'HERMES_FROM_EMAIL' },
      { status: 503 },
    );
  }

  const stalePendingCount = await countStalePending(supabase);

  // La campagne la moins récemment servie. `updated_at` est touché à chaque
  // passage, ce qui fait tourner les comptes sans table de file d'attente.
  const { data: rows, error } = await supabase
    .from('hermes_campaigns')
    .select('id, owner_id, sender_name, reply_to_email, subject, body, daily_quota, paused_at, suspended_at')
    .is('suspended_at', null)
    .is('paused_at', null)
    .order('updated_at', { ascending: true })
    .limit(1);

  if (error) {
    return NextResponse.json({ error: 'lecture des campagnes impossible' }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json({ processed: 0, reason: 'aucune campagne active', stalePendingCount });
  }

  const campaign: Campaign = toCampaign(rows[0] as unknown as CampaignRow);

  const allowed = await campaignCanSend(campaign);
  if (!allowed.ok) {
    // On touche quand même la campagne pour ne pas la reprendre en boucle au
    // passage suivant : sans cela, une campagne bloquée monopoliserait le
    // planificateur et aucune autre ne serait servie.
    await supabase
      .from('hermes_campaigns')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', campaign.id);

    return NextResponse.json({
      processed: 0,
      campaign: campaign.id,
      skipped: allowed.reason,
      stalePendingCount,
    });
  }

  // L'e-mail du compte définit le périmètre des prospects joignables.
  const { data: userData } = await supabase.auth.admin.getUserById(campaign.ownerId);
  const ownerEmail = userData?.user?.email;
  if (!ownerEmail) {
    return NextResponse.json({
      processed: 0,
      campaign: campaign.id,
      skipped: 'compte introuvable',
      stalePendingCount,
    });
  }

  const quota = await remainingQuota(campaign);
  const candidates = await nextCandidates(
    ownerEmail,
    campaign.ownerId,
    campaign.id,
    Math.min(BATCH_SIZE, quota),
  );

  const resend = new Resend(apiKey);
  let sent = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    // 1. Dernière barrière, juste avant tout engagement (réservation
    // comprise) : quelqu'un a pu se désinscrire depuis la constitution de la
    // file.
    if (await isSuppressed(candidate.email)) {
      await supabase
        .from('agent_prospects')
        .update({ opted_out_at: new Date().toISOString() })
        .eq('id', candidate.prospectId);
      skipped += 1;
      continue;
    }

    // 2. Le corps doit être connu pour être journalisé dès la réservation.
    const unsubscribeUrl = unsubscribeUrlFor(candidate.unsubscribeToken);
    const message = composeMessage(campaign, candidate, unsubscribeUrl);

    // 3. Réservation : verrou atomique sur (campaign_id, prospect_id).
    // `sent_at` (défaut `now()`) marque ici l'instant de la tentative, pas
    // celui d'un envoi confirmé — voir le commentaire d'en-tête et la
    // migration 019. Jamais retouché à la finalisation, pour que
    // `remainingQuota` continue de fermer le quota sur les tentatives.
    const { data: reserved, error: reserveError } = await supabase
      .from('hermes_messages')
      .insert({
        campaign_id: campaign.id,
        prospect_id: candidate.prospectId,
        to_email: candidate.email,
        subject: message.subject,
        body: message.text,
        status: 'pending',
        provider_id: null,
      })
      .select('id')
      .single();

    if (reserveError) {
      if (reserveError.code === '23505') {
        // Déjà réservé par un passage précédent ou concurrent : ne jamais
        // retenter un envoi déjà réservé, même si on ignore son issue.
        skipped += 1;
        continue;
      }
      // Une réservation qu'on ne peut pas écrire est une trace qu'on ne
      // pourra pas produire — même règle que le quota illisible : on
      // n'envoie pas.
      console.error(
        '[agent/outreach] réservation impossible',
        candidate.prospectId,
        reserveError.message,
      );
      skipped += 1;
      continue;
    }

    // 4. Sort le prospect de `nextCandidates` dès maintenant, pas après
    // l'envoi — voir le commentaire d'en-tête.
    const { error: contactedError } = await supabase
      .from('agent_prospects')
      .update({ contacted_at: new Date().toISOString() })
      .eq('id', candidate.prospectId);

    if (contactedError) {
      console.error(
        '[agent/outreach] marquage contacted_at impossible',
        candidate.prospectId,
        contactedError.message,
      );
      const { error: failError } = await supabase
        .from('hermes_messages')
        .update({ status: 'failed', error: contactedError.message.slice(0, 500) })
        .eq('id', reserved.id);
      if (failError) {
        console.error('[agent/outreach] finalisation failed impossible', reserved.id, failError.message);
      }
      skipped += 1;
      continue;
    }

    // 5. L'envoi.
    const { data: result, error: sendError } = await resend.emails.send({
      from,
      to: candidate.email,
      // La réponse va au professionnel, pas à Qualifyr : c'est lui
      // l'interlocuteur, et une réponse qui atterrirait chez nous serait
      // perdue pour tout le monde.
      replyTo: campaign.replyToEmail,
      subject: message.subject,
      text: message.text,
      headers: {
        /*
         * `List-Unsubscribe` et son pendant « un clic » sont exigés par Gmail
         * et Yahoo depuis 2024 pour tout envoi de masse. Sans eux, les
         * messages sont classés indésirables avant même d'être lus — et le
         * lien textuel du pied de page n'y suffit pas : ces clients cherchent
         * l'en-tête, pas le corps.
         */
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    // 6. Finalisation de la ligne réservée.
    if (sendError) {
      const { error: failUpdateError } = await supabase
        .from('hermes_messages')
        .update({ status: 'failed', error: sendError.message.slice(0, 500) })
        .eq('id', reserved.id);
      if (failUpdateError) {
        console.error(
          '[agent/outreach] finalisation failed impossible',
          reserved.id,
          failUpdateError.message,
        );
      }

      // Une adresse rejetée définitivement par le fournisseur ne doit plus
      // jamais être tentée : réessayer dégrade la réputation d'envoi.
      if (/invalid|not exist|bounce/i.test(sendError.message)) {
        await suppress(candidate.email, 'bounced', campaign.ownerId);
      }
      continue;
    }

    const { error: sentUpdateError } = await supabase
      .from('hermes_messages')
      .update({ status: 'sent', provider_id: result?.id ?? null })
      .eq('id', reserved.id);
    if (sentUpdateError) {
      console.error(
        '[agent/outreach] finalisation sent impossible',
        reserved.id,
        sentUpdateError.message,
      );
    }

    sent += 1;
  }

  await supabase
    .from('hermes_campaigns')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', campaign.id);

  return NextResponse.json({ processed: sent, skipped, campaign: campaign.id, stalePendingCount });
}
