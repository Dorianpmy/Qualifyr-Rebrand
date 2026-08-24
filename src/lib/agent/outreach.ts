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

export type { Campaign, EmailSource, OutreachCandidate } from './outreach-message';
export { composeMessage, fillTemplate } from './outreach-message';

import type { Campaign, EmailSource, OutreachCandidate } from './outreach-message';

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
 * Combien de candidats potentiels examiner pour en retenir `limit`.
 *
 * **Pourquoi plus que `limit`.** Depuis l'enrichissement OSM, une même
 * adresse peut légitimement être partagée par plusieurs prospects (une
 * franchise, un groupe — voir `osm-enrich.ts`). Le dédoublonnage ci-dessous
 * réduit alors le nombre de candidats utiles : sans marge, une zone où les
 * premiers prospects du tri partagent tous la même adresse renverrait une
 * file plus courte que demandé alors que d'autres prospects, plus loin dans
 * l'ordre, auraient pu la compléter. Le facteur est généreux et le plafond
 * absolu borne le coût dans le pire cas.
 */
const CANDIDATE_POOL_MULTIPLIER = 20;
const CANDIDATE_POOL_MAX = 300;

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
 *
 * **Dédoublonnage par adresse, ici, avant l'envoi.** Deux prospects distincts
 * peuvent légitimement partager la même adresse (une franchise, un groupe —
 * voir `MAX_SHARED_EMAIL_ATTRIBUTIONS` dans `osm-enrich.ts`, qui refuse
 * seulement l'attribution au-delà d'une dizaine, pas entre un et dix). Le
 * garder tel quel enverrait plusieurs messages identiques à la même boîte le
 * même jour — exactement le profil qui déclenche un signalement, quel que
 * soit le soin mis au reste. Une adresse déjà présente plus haut dans ce même
 * lot, ou déjà contactée par **cette campagne** (sur n'importe lequel des
 * prospects qui la portent, pas seulement celui-ci), est sautée : le prospect
 * reste en base avec son e-mail, il n'est simplement pas candidat cette fois.
 * L'index unique `(campaign_id, prospect_id)` de `hermes_messages` protège le
 * prospect, pas l'adresse — il ne remplace pas ce contrôle.
 *
 * **Deux bassins fusionnés (migration 022) : prospects recensés
 * (`agent_prospects`, scopés par zone, retrouvée par e-mail — voir plus haut)
 * et prospects importés (`agent_imported_prospects`, scopés directement par
 * `owner_id`, sans passer par une zone).** Le second bassin utilise un filtre
 * différent et c'est délibéré : une liste importée n'a jamais de zone à
 * réconcilier, `owner_id` est l'identifiant stable du compte authentifié qui
 * l'a téléversée. Les deux bassins sont fusionnés puis triés une seule fois
 * (pertinence d'abord, ancienneté ensuite) avant le dédoublonnage ci-dessus,
 * qui s'applique alors identiquement aux deux : un prospect importé passe par
 * les mêmes barrières qu'un prospect recensé, aucune ne lui est propre.
 */

/** Forme commune aux deux bassins (zones recensées, liste importée), le
 *  temps de les fusionner et de les trier ensemble — voir `nextCandidates`. */
type PoolRow = {
  readonly id: string;
  readonly name: string;
  readonly city: string | null;
  readonly email: string;
  readonly emailSource: EmailSource | null;
  readonly unsubscribeToken: string;
  readonly relevanceScore: number | null;
  readonly createdAt: string;
};

export async function nextCandidates(
  ownerEmail: string,
  /* Utilisé pour le bassin des listes importées (`agent_imported_prospects`,
     scopées par `owner_id`, pas par e-mail — voir `import-prospects.ts`) et
     pour retrouver les adresses déjà contactées par *cette* campagne
     (dédoublonnage ci-dessous). Jamais pour élargir le périmètre des
     prospects *recensés*, qui reste `ownerEmail` seul via `agent_zones`. Ne
     pas réutiliser ce paramètre pour un filtre supplémentaire sans relire le
     commentaire ci-dessus sur la fuite que `campaign` a déjà causée une fois. */
  ownerId: string,
  campaignId: string,
  limit: number,
): Promise<readonly OutreachCandidate[]> {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return [];

  const poolSize = Math.min(limit * CANDIDATE_POOL_MULTIPLIER, CANDIDATE_POOL_MAX);

  // 1. Les zones de ce compte, et elles seules.
  const { data: zones, error: zonesError } = await supabase
    .from('agent_zones')
    .select('id')
    .ilike('email', ownerEmail);

  if (zonesError) return [];

  const zoneIds = (zones ?? []).map((z) => z.id as string);

  // 2. Les prospects recensés de ces zones, contactables.
  //
  // Tri par pertinence d'abord (voir `lib/agent/relevance.ts`), par
  // ancienneté ensuite. `nullsFirst: false` est nécessaire : sur un tri
  // DESC, Postgres met les NULL en tête par défaut — sans cette précision,
  // tous les prospects jamais notés passeraient devant les notés, l'inverse
  // de ce qui est demandé. Un prospect jamais noté (`relevance_score` nul)
  // reste candidat comme les autres, seulement en dernier : le score
  // ordonne, il n'exclut jamais.
  const recensedPool: PoolRow[] = [];
  if (zoneIds.length > 0) {
    const { data: pool, error } = await supabase
      .from('agent_prospects')
      .select('id, name, city, email, email_source, unsubscribe_token, relevance_score, created_at')
      .in('zone_id', zoneIds)
      .not('email', 'is', null)
      .is('contacted_at', null)
      .is('opted_out_at', null)
      .order('relevance_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: true })
      .limit(poolSize);

    if (error) return [];

    for (const row of (pool ?? []) as unknown as readonly {
      id: string;
      name: string;
      city: string | null;
      email: string;
      email_source: EmailSource | null;
      unsubscribe_token: string;
      relevance_score: number | null;
      created_at: string;
    }[]) {
      recensedPool.push({
        id: row.id,
        name: row.name,
        city: row.city,
        email: row.email,
        emailSource: row.email_source,
        unsubscribeToken: row.unsubscribe_token,
        relevanceScore: row.relevance_score,
        createdAt: row.created_at,
      });
    }
  }

  // 2 bis. Les prospects importés par ce compte (`import-prospects.ts`),
  // contactables — scopés par `owner_id`, jamais par e-mail : c'est
  // l'assertion à vérifier en premier si une fuite entre comptes est un jour
  // suspectée sur ce bassin.
  const { data: importedRows, error: importedError } = await supabase
    .from('agent_imported_prospects')
    .select('id, name, email, unsubscribe_token, created_at')
    .eq('owner_id', ownerId)
    .is('contacted_at', null)
    .is('opted_out_at', null)
    .order('created_at', { ascending: true })
    .limit(poolSize);

  if (importedError) return [];

  const importedPool: PoolRow[] = ((importedRows ?? []) as unknown as readonly {
    id: string;
    name: string;
    email: string;
    unsubscribe_token: string;
    created_at: string;
  }[]).map((row) => ({
    id: row.id,
    name: row.name,
    city: null,
    email: row.email,
    emailSource: 'fourni_par_expediteur' as EmailSource,
    unsubscribeToken: row.unsubscribe_token,
    relevanceScore: null, // jamais noté : se comporte comme un prospect recensé jamais scoré, aucun traitement de faveur
    createdAt: row.created_at,
  }));

  if (recensedPool.length === 0 && importedPool.length === 0) return [];

  // Fusion des deux bassins, puis un seul tri : un prospect importé se place
  // exactement comme un prospect recensé jamais noté (relevance_score nul) —
  // par ancienneté, jamais en tête ni en systématique dernier recours.
  const rows = [...recensedPool, ...importedPool].sort((a, b) => {
    const scoreA = a.relevanceScore ?? -1;
    const scoreB = b.relevanceScore ?? -1;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
  });

  // 3. Adresses déjà contactées par cette campagne — sur n'importe quel
  // prospect, pas seulement celui du lot. `to_email` est dupliqué dans
  // `hermes_messages` précisément pour rester exact indépendamment de
  // `agent_prospects` (voir la migration 016) ; c'est cette copie qu'on lit.
  //
  // **Non bornée, à la différence du reste de ce moteur.** Toutes les autres
  // lectures d'Hermès sont plafonnées (le lot ci-dessus, `REPORT_RETRY_BATCH`,
  // `RELEVANCE_BATCH_SIZE`…) ; celle-ci lit l'historique complet de la
  // campagne. Sans conséquence aujourd'hui — quarante messages par jour au
  // plus, donc quelques milliers de lignes après un an — mais si un passage
  // de cette route ralentit un jour sans changement évident ailleurs, c'est
  // ici qu'il faut regarder en premier.
  const { data: alreadySent, error: sentError } = await supabase
    .from('hermes_messages')
    .select('to_email')
    .eq('campaign_id', campaignId);

  // Vérification impossible ⇒ on ne peut pas garantir l'absence de doublon :
  // même principe que `isSuppressed`, on ne prend pas le risque.
  if (sentError) return [];

  const usedEmails = new Set(
    (alreadySent as readonly { to_email: string }[] | null ?? []).map((row) =>
      row.to_email.trim().toLowerCase(),
    ),
  );

  const candidates: OutreachCandidate[] = [];
  for (const row of rows) {
    if (candidates.length >= limit) break;

    const email = row.email.trim().toLowerCase();
    if (usedEmails.has(email)) continue; // déjà contacté par cette campagne, ou déjà pris plus haut dans ce lot

    if (!row.emailSource) {
      // Ne devrait jamais arriver pour un prospect recensé — email et
      // email_source sont écrits ensemble (voir la migration 021) ; un
      // prospect importé porte toujours `fourni_par_expediteur`, fixé en
      // base (migration 022). Le genre d'impossibilité qui finit par se
      // produire après une reprise manuelle en base ; sans ce log, personne
      // ne le verrait jamais.
      console.warn('[agent/outreach] email sans email_source, prospect sauté', row.id);
      continue;
    }

    usedEmails.add(email);
    candidates.push({
      prospectId: row.id,
      email: row.email,
      emailSource: row.emailSource,
      businessName: row.name,
      city: row.city,
      unsubscribeToken: row.unsubscribeToken,
    });
  }

  return candidates;
}

/** Adresse publique de désinscription pour un jeton donné. */
export function unsubscribeUrlFor(token: string): string {
  return `${productionUrl}/desinscription/${token}`;
}
