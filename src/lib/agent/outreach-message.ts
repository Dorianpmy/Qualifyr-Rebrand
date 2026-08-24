/**
 * Hermès — composition du message.
 *
 * **Séparé de `outreach.ts` pour une raison précise :** ce dernier porte
 * `import 'server-only'`, ce qui interdit son import depuis un test ou un
 * composant client. Or ce qui est composé ici est exactement la partie qui
 * engage juridiquement — l'origine des données, le lien de désinscription,
 * l'identité de l'expéditeur — donc la partie qu'il faut pouvoir tester le
 * plus facilement, et afficher en aperçu au professionnel avant qu'il ne
 * signe.
 *
 * Aucun accès réseau, aucune base : tout est calculable à partir des
 * arguments.
 */

/**
 * D'où vient `email` — voir migration 021. `osm_tag` : porté directement par
 * OpenStreetMap. `site_web` : relevé par Qualifyr sur le site officiel que
 * OpenStreetMap indique.
 */
export type EmailSource = 'osm_tag' | 'site_web';

/** Ce qu'il faut pour envoyer un message à un prospect. */
export type OutreachCandidate = {
  readonly prospectId: string;
  readonly email: string;
  readonly emailSource: EmailSource;
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
 * La phrase d'origine de l'adresse, selon sa source réelle — article 14 du
 * RGPD : il faut communiquer l'origine véritable, pas une origine plausible.
 *
 * `site_web` : Qualifyr l'a lue elle-même sur le site du prospect, la phrase
 * historique reste donc exacte. `osm_tag` : l'adresse vient directement des
 * données d'OpenStreetMap — Qualifyr n'a jamais visité le site du prospect
 * pour cette adresse, même si un contributeur OSM l'y a peut-être recopiée à
 * l'origine. Dire « publiée sur votre site » dans ce cas serait faux.
 */
function originSentence(source: EmailSource): string {
  return source === 'osm_tag'
    ? 'Vous recevez ce message parce que votre établissement figure au répertoire public des entreprises et que cette adresse figure dans les données cartographiques publiques d’OpenStreetMap.'
    : 'Vous recevez ce message parce que votre établissement figure au répertoire public des entreprises et que cette adresse est publiée sur votre site.';
}

/**
 * Compose le message final.
 *
 * **Le bloc de pied de page n'est pas négociable et n'est pas modifiable par
 * le professionnel.** Il porte trois obligations : dire qui écrit, dire d'où
 * vient l'adresse (article 14 du RGPD — les données ont été collectées
 * indirectement, auprès du répertoire des entreprises et, selon le cas, du
 * site public du destinataire ou d'OpenStreetMap), et permettre de s'opposer
 * en un clic.
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
    originSentence(candidate.emailSource),
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

