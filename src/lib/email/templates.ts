import type { ContactData, EstimationData } from '@/lib/validation';
import type { AttributionData, AttributionTouch } from '@/lib/attribution';

/**
 * Composition des e-mails.
 *
 * Texte brut uniquement : c'est lisible partout, léger, et cela évite toute
 * question d'échappement HTML sur des données saisies par un visiteur.
 */

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(date);
}

function line(label: string, value: string | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? `${label} : ${trimmed}` : null;
}

function block(title: string, lines: readonly (string | null)[]): string {
  const kept = lines.filter((item): item is string => item !== null);
  if (kept.length === 0) return '';
  return [title, '─'.repeat(title.length), ...kept, ''].join('\n');
}

function attributionLines(prefix: string, touch: AttributionTouch | undefined) {
  if (!touch) return [];
  return [
    line(`${prefix} — source`, touch.source ?? 'Source directe ou non identifiée'),
    line(`${prefix} — support`, touch.medium),
    line(`${prefix} — campagne`, touch.campaign),
    line(`${prefix} — contenu`, touch.content),
    line(`${prefix} — terme`, touch.term),
    line(`${prefix} — référent`, touch.referrerDomain),
    line(`${prefix} — page d’arrivée`, touch.landingPath),
    line(`${prefix} — première vue`, touch.firstSeenAt),
  ];
}

function attributionBlock(attribution: AttributionData | undefined, submissionPage: string) {
  const touchLines = [
    ...attributionLines('Premier contact', attribution?.firstTouch),
    ...attributionLines('Dernier contact', attribution?.lastTouch),
  ];
  return block('Origine de la demande', [
    line('Page de soumission', submissionPage),
    ...(touchLines.length > 0
      ? touchLines
      : [line('Source', 'Source directe ou non identifiée')]),
  ]);
}

/* ------------------------------------------------------------------ */
/* Notification reçue par Qualifyr                                     */
/* ------------------------------------------------------------------ */

export function contactNotification(data: ContactData, receivedAt: Date) {
  const text = [
    block('Message de contact', [
      line('Formulaire', 'Contact'),
      line('Reçu le', formatDate(receivedAt)),
      line('Page d’origine', data.pageUrl),
    ]),
    block('Coordonnées', [
      line('Nom', data.fullName),
      line('E-mail', data.email),
      line('Entreprise', data.company),
    ]),
    block('Message', [data.message]),
    attributionBlock(data.attribution, data.pageUrl),
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject: `Contact — ${data.fullName}`,
    text,
  };
}

/* ------------------------------------------------------------------ */
/* Demande d'estimation                                                */
/* ------------------------------------------------------------------ */

/**
 * Notification d'une estimation terminée.
 *
 * **La recommandation figure dans l'objet.** Dorian traite ces demandes depuis
 * son téléphone : l'offre retenue est l'information qui décide s'il rappelle
 * tout de suite ou en fin de journée, elle doit être lisible sans ouvrir le
 * message.
 *
 * Les réponses arrivent déjà mises en forme par le client — une ligne par
 * question, libellés en toutes lettres et non identifiants techniques. Les
 * relire côté serveur pour les reformater dupliquerait la table des libellés,
 * avec la divergence assurée le jour où l'un des deux change.
 */
export function estimationNotification(data: EstimationData, receivedAt: Date) {
  const text = [
    block('Demande d’estimation', [
      line('Recommandation', data.recommendation),
      line('Reçue le', formatDate(receivedAt)),
      line('Page d’origine', data.pageUrl),
    ]),
    block('Coordonnées', [
      line('Prénom', data.firstName),
      line('Nom / entreprise', data.lastName),
      line('E-mail', data.email),
      line('Téléphone', data.phone),
      line('Activité', data.businessName),
      line('Zone', data.area),
    ]),
    block('Réponses', [data.answers]),
    attributionBlock(data.attribution, data.pageUrl),
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject: `Estimation — ${data.recommendation} — ${data.firstName} ${data.lastName}`,
    text,
  };
}

/* ------------------------------------------------------------------ */
/* Accusé de réception envoyé au visiteur                              */
/* ------------------------------------------------------------------ */

/**
 * Ton sobre, résumé minimal.
 *
 * **Aucun délai de réponse n'est annoncé** : aucun n'est tenable aujourd'hui,
 * et une promesse non tenue coûte plus qu'une absence de promesse
 * (AGENTS.md, §6). Les coordonnées ne sont ajoutées que si elles existent
 * réellement dans `src/content/contact.ts`.
 */
export function acknowledgement(
  data: { readonly fullName: string; readonly email: string },
  options: { readonly replyTo: string | null; readonly siteUrl: string },
) {
  const text = [
    `Bonjour ${data.fullName},`,
    '',
    'Nous avons bien reçu votre message.',
    '',
    'Nous vous répondons à cette adresse.',
    '',
    options.replyTo
      ? `Si vous souhaitez ajouter quelque chose, répondez simplement à cet e-mail ou écrivez à ${options.replyTo}.`
      : 'Si vous souhaitez ajouter quelque chose, répondez simplement à cet e-mail.',
    '',
    '—',
    'Qualifyr',
    'SaaS pour laveurs auto et detailing automobile',
    options.siteUrl,
  ].join('\n');

  return {
    subject: 'Votre message — Qualifyr Agence',
    text,
  };
}
