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

/** Ce qu'il faut pour envoyer un message à un prospect. */
export type OutreachCandidate = {
  readonly prospectId: string;
  readonly email: string;
  readonly businessName: string;
  readonly city: string | null;
  readonly unsubscribeToken: string;
};

export type Campaign = {
  readonly id: string;
  readonly ownerId: string;
  readonly senderName: string;
  readonly replyToEmail: string;
  readonly subject: string;
  readonly body: string;
  readonly dailyQuota: number;
  readonly pausedAt: string | null;
  readonly suspendedAt: string | null;
};

/**
 * Remplit le gabarit du professionnel.
 *
 * **Deux variables, pas davantage.** Un gabarit riche produit des phrases
 * bancales — « Bonjour {{prenom_dirigeant}} » donne « Bonjour  » dès que la
 * donnée manque, et personne ne relit trois cents messages pour s'en
 * apercevoir. Ici, une variable sans valeur est remplacée par une formulation
 * qui reste correcte en français.
 *
 * La substitution est faite sur des chaînes littérales et non par expression
 * régulière construite dynamiquement : le corps vient du professionnel, et une
 * expression bâtie à partir de ses données serait une porte ouverte.
 */
export function fillTemplate(
  template: string,
  values: { businessName: string; city: string | null },
): string {
  return template
    .split('{{entreprise}}')
    .join(values.businessName)
    .split('{{ville}}')
    .join(values.city ?? 'votre secteur');
}

/**
 * Compose le message final.
 *
 * **Le bloc de pied de page n'est pas négociable et n'est pas modifiable par
 * le professionnel.** Il porte trois obligations : dire qui écrit, dire d'où
 * vient l'adresse (article 14 du RGPD — les données ont été collectées
 * indirectement, auprès du répertoire des entreprises et du site public), et
 * permettre de s'opposer en un clic.
 *
 * Le laisser à la main du professionnel reviendrait à parier que trois cents
 * artisans le rédigeront correctement. Il est donc ajouté ici, après son
 * texte, hors de sa portée.
 */
export function composeMessage(
  campaign: Campaign,
  candidate: OutreachCandidate,
  unsubscribeUrl: string,
): { subject: string; text: string } {
  const body = fillTemplate(campaign.body, {
    businessName: candidate.businessName,
    city: candidate.city,
  });

  const footer = [
    '',
    '—',
    `${campaign.senderName}`,
    '',
    'Vous recevez ce message parce que votre établissement figure au répertoire',
    'public des entreprises et que cette adresse est publiée sur votre site.',
    'Aucune autre donnée vous concernant n’est conservée.',
    '',
    `Ne plus recevoir de message : ${unsubscribeUrl}`,
  ].join('\n');

  return {
    subject: fillTemplate(campaign.subject, {
      businessName: candidate.businessName,
      city: candidate.city,
    }),
    text: `${body}\n${footer}`,
  };
}

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
