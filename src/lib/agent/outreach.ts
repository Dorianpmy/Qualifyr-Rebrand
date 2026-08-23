import 'server-only';

import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';

/**
 * Hermès — la mécanique de prospection sortante.
 *
 * **Ce module est la seule porte d'entrée vers un envoi.** Toute la logique
 * qui décide *si* un message peut partir vit ici, et nulle part ailleurs :
 * la route planifiée ne fait qu'appeler ces fonctions. Un second chemin
 * d'envoi, même temporaire, contournerait les garde-fous — et les garde-fous
 * sont ce qui sépare un outil de prospection d'un émetteur de spam.
 *
 * ## Les quatre barrières, dans l'ordre où elles s'appliquent
 *
 * 1. **La campagne existe et n'est pas coupée.** Sans ligne dans
 *    `hermes_campaigns`, le professionnel n'a jamais accepté d'être
 *    l'expéditeur : rien ne part.
 * 2. **L'abonnement porte la capacité `agent.prospecting`.** Vérifié à chaque
 *    passage, jamais mis en cache : un abonnement résilié doit arrêter les
 *    envois le jour même, pas au prochain redéploiement.
 * 3. **Le quota quotidien n'est pas atteint.**
 * 4. **L'adresse n'est pas sur la liste de suppression globale.** C'est la
 *    dernière vérification avant l'envoi, et la plus importante.
 *
 * Aucune de ces barrières n'est décorative, et aucune ne doit être déplacée
 * dans l'appelant : c'est ici qu'elles sont testables sans réseau.
 */

export type { Campaign, OutreachCandidate } from './outreach-message';
export { composeMessage, fillTemplate } from './outreach-message';

import type { Campaign, OutreachCandidate } from './outreach-message';

/**
 * Combien de messages cette campagne peut-elle encore envoyer aujourd'hui ?
 *
 * La fenêtre est glissante sur vingt-quatre heures plutôt que calée sur le
 * jour civil : sans cela, un compte enverrait son quota à 23 h 50 puis le
 * double à 00 h 10, ce qui est exactement le profil d'envoi qu'un filtre
 * anti-spam repère.
 */
export async function remainingQuota(campaign: Campaign): Promise<number> {
  const supabase = getServiceSupabaseClient();
  // Sans configuration Supabase, on ne peut pas compter : quota nul, donc
  // aucun envoi. Même raisonnement que pour l'erreur de lecture plus bas.
  if (!supabase) return 0;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('hermes_messages')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id)
    .gte('sent_at', since);

  // En cas d'erreur de lecture, on renvoie zéro plutôt que le quota complet.
  // Un décompte impossible ne doit jamais ouvrir les vannes : c'est la
  // différence entre un incident sans conséquence et trois cents messages
  // partis en double.
  if (error) return 0;

  return Math.max(0, campaign.dailyQuota - (count ?? 0));
}

/**
 * L'adresse est-elle interdite d'envoi ?
 *
 * Vérifiée juste avant l'envoi, et non au moment de constituer la file : entre
 * les deux, quelqu'un a pu se désinscrire. Le coût est d'une requête par
 * message, ce qui est dérisoire face au fait d'écrire à quelqu'un qui vient de
 * demander à ne plus l'être.
 */
export async function isSuppressed(email: string): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  // Impossible de vérifier ⇒ on considère l'adresse comme interdite.
  if (!supabase) return true;

  const { data, error } = await supabase
    .from('hermes_suppressions')
    .select('email')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  // Prudence identique : une vérification impossible vaut suppression.
  if (error) return true;

  return data !== null;
}

/**
 * Inscrit une adresse sur la liste globale.
 *
 * `upsert` et non `insert` : la même adresse peut se désinscrire deux fois, et
 * un doublon ne doit pas faire échouer l'opération — surtout appelée depuis
 * une page de désinscription, où l'échec serait visible par le destinataire.
 */
export async function suppress(
  email: string,
  reason: 'unsubscribed' | 'bounced' | 'complained' | 'manual',
  sourceOwnerId?: string | null,
): Promise<void> {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return;

  await supabase.from('hermes_suppressions').upsert(
    {
      email: email.trim().toLowerCase(),
      reason,
      source_owner_id: sourceOwnerId ?? null,
    },
    { onConflict: 'email' },
  );
}

/**
 * Traite une désinscription à partir du jeton reçu dans un message.
 *
 * Deux effets, et les deux comptent : le prospect est marqué comme opposé
 * (il ne ressortira plus dans aucune file, car l'index partiel de
 * `agent_prospects` exclut `opted_out_at`), et son adresse entre sur la liste
 * globale (aucun autre compte ne pourra plus l'atteindre).
 *
 * Le premier seul ne suffirait pas : la même entreprise peut avoir été
 * recensée dans la zone de plusieurs professionnels, sous plusieurs lignes.
 *
 * Renvoie le nom de l'établissement quand il est connu, pour que la page de
 * confirmation puisse dire de quoi on parle.
 */
export async function unsubscribeByToken(
  token: string,
): Promise<{ ok: boolean; businessName: string | null }> {
  const supabase = getServiceSupabaseClient();
  /* Une désinscription qu'on ne peut pas enregistrer doit se signaler comme
     telle : annoncer « c'est fait » sans l'avoir fait est la pire réponse
     possible sur cette page, puisque la personne ne réessaiera pas. */
  if (!supabase) return { ok: false, businessName: null };

  const { data, error } = await supabase
    .from('agent_prospects')
    .select('id, name, email, opted_out_at')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (error || !data) return { ok: false, businessName: null };

  const prospect = data as {
    id: string;
    name: string;
    email: string | null;
    opted_out_at: string | null;
  };

  // Déjà désinscrit : on répond succès sans rien réécrire. Afficher une erreur
  // à quelqu'un qui reclique sur le lien lui laisserait croire que sa demande
  // n'a pas été prise en compte.
  if (prospect.opted_out_at) {
    return { ok: true, businessName: prospect.name };
  }

  await supabase
    .from('agent_prospects')
    .update({ opted_out_at: new Date().toISOString() })
    .eq('id', prospect.id);

  if (prospect.email) await suppress(prospect.email, 'unsubscribed');

  return { ok: true, businessName: prospect.name };
}

/* ------------------------------------------------------------------ */
/* Le moteur                                                           */
/* ------------------------------------------------------------------ */

import { canAccess } from '@/lib/billing/entitlements';
import { getEntitlement } from '@/lib/billing/subscription';
import { productionUrl } from '@/content/site';

/** Ligne de `hermes_campaigns` telle qu'elle sort de la base. */
export type CampaignRow = {
  id: string;
  owner_id: string;
  sender_name: string;
  reply_to_email: string;
  subject: string;
  body: string;
  daily_quota: number;
  paused_at: string | null;
  suspended_at: string | null;
};

export function toCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    ownerId: row.owner_id,
    senderName: row.sender_name,
    replyToEmail: row.reply_to_email,
    subject: row.subject,
    body: row.body,
    dailyQuota: row.daily_quota,
    pausedAt: row.paused_at,
    suspendedAt: row.suspended_at,
  };
}

/**
 * Cette campagne a-t-elle le droit d'envoyer, maintenant ?
 *
 * **L'abonnement est revérifié à chaque passage, jamais mis en cache.** Une
 * résiliation doit arrêter les envois dans l'heure, pas au prochain
 * redéploiement — et un compte qui continue de prospecter après avoir cessé de
 * payer est le genre de chose qu'on ne découvre que par une réclamation.
 *
 * Renvoie la raison du refus plutôt qu'un booléen : elle est journalisée, et
 * sans elle un envoi qui ne part pas est indébogable.
 */
export async function campaignCanSend(
  campaign: Campaign,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (campaign.suspendedAt) return { ok: false, reason: 'suspendue' };
  if (campaign.pausedAt) return { ok: false, reason: 'en pause' };

  const entitlement = await getEntitlement(campaign.ownerId);
  if (!canAccess(entitlement, 'agent.prospecting')) {
    return { ok: false, reason: 'abonnement sans la capacité agent.prospecting' };
  }

  const remaining = await remainingQuota(campaign);
  if (remaining <= 0) return { ok: false, reason: 'quota quotidien atteint' };

  return { ok: true };
}

/**
 * Les prospects que cette campagne peut encore contacter.
 *
 * **Le filtrage par propriétaire se fait en deux temps, et il est le point
 * critique de cette fonction.** Une première version interrogeait
 * `agent_prospects` sans restriction : elle aurait fait écrire la campagne de
 * Marc aux entreprises recensées par Julien. Le typage l'a révélé — le
 * paramètre `campaign` n'était utilisé nulle part — mais c'est le genre de
 * défaut qui ne se voit pas à la lecture et qui se découvre par une plainte.
 *
 * Le rattachement passe par l'e-mail et non par `detailer_id` : une zone
 * demandée depuis le site vitrine, avant toute inscription, n'a pas encore de
 * `detailer_id`. C'est déjà la clé qu'emploie `claimZonesForDetailer`.
 *
 * L'ordre est celui de la création, pour que deux passages successifs ne
 * reprennent pas les mêmes lignes en en laissant d'autres indéfiniment de
 * côté.
 *
 * La liste de suppression n'est **pas** filtrée ici : elle l'est juste avant
 * l'envoi. Entre la constitution de la file et le dernier message, quelqu'un a
 * pu se désinscrire.
 */
export async function nextCandidates(
  /* La campagne n'est volontairement pas un paramètre : le périmètre est
     défini par l'e-mail du compte, et un argument non utilisé donnerait
     l'illusion d'un filtrage qui n'existe pas — c'est exactement ce qui a
     produit la fuite corrigée ici. */
  ownerEmail: string,
  limit: number,
): Promise<readonly OutreachCandidate[]> {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return [];

  // 1. Les zones de ce compte, et elles seules.
  const { data: zones, error: zonesError } = await supabase
    .from('agent_zones')
    .select('id')
    .ilike('email', ownerEmail);

  if (zonesError || !zones || zones.length === 0) return [];

  const zoneIds = (zones as readonly { id: string }[]).map((z) => z.id);

  // 2. Les prospects de ces zones, contactables.
  //
  // Tri par pertinence d'abord (voir `lib/agent/relevance.ts`), par
  // ancienneté ensuite. `nullsFirst: false` est nécessaire : sur un tri
  // DESC, Postgres met les NULL en tête par défaut — sans cette précision,
  // tous les prospects jamais notés passeraient devant les notés, l'inverse
  // de ce qui est demandé. Un prospect jamais noté (`relevance_score` nul)
  // reste candidat comme les autres, seulement en dernier : le score
  // ordonne, il n'exclut jamais.
  const { data, error } = await supabase
    .from('agent_prospects')
    .select('id, name, city, email, unsubscribe_token')
    .in('zone_id', zoneIds)
    .not('email', 'is', null)
    .is('contacted_at', null)
    .is('opted_out_at', null)
    .order('relevance_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  return (
    data as unknown as readonly {
      id: string;
      name: string;
      city: string | null;
      email: string;
      unsubscribe_token: string;
    }[]
  ).map((row) => ({
    prospectId: row.id,
    email: row.email,
    businessName: row.name,
    city: row.city,
    unsubscribeToken: row.unsubscribe_token,
  }));
}

/** Adresse publique de désinscription pour un jeton donné. */
export function unsubscribeUrlFor(token: string): string {
  return `${productionUrl}/desinscription/${token}`;
}
