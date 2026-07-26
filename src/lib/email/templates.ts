import {
  activityOptions,
  bookingMethodOptions,
  labelFor,
  priorityOptions,
  seniorityOptions,
} from '@/content/forms';
import type { ContactData, DiagnosticData } from '@/lib/validation';

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

/* ------------------------------------------------------------------ */
/* Notification reçue par Qualifyr                                     */
/* ------------------------------------------------------------------ */

export function diagnosticNotification(data: DiagnosticData, receivedAt: Date) {
  const methods = data.bookingMethods
    .map((value) => labelFor(bookingMethodOptions, value))
    .join(', ');

  const text = [
    block('Demande de diagnostic', [
      line('Formulaire', 'Diagnostic'),
      line('Reçue le', formatDate(receivedAt)),
      line('Page d’origine', data.pageUrl),
    ]),
    block('Coordonnées', [
      line('Nom', data.fullName),
      line('E-mail', data.email),
      line('Téléphone', data.phone),
    ]),
    block('Activité', [
      line('Type d’activité', labelFor(activityOptions, data.activity)),
      line('Précisions', data.activityDetails),
      line('Entreprise', data.company),
      line('Zone couverte', data.area),
      line('Ancienneté', labelFor(seniorityOptions, data.seniority)),
      line('Site actuel', data.website),
    ]),
    block('Situation', [
      line('Réservations reçues par', methods),
      line('Objectif prioritaire', labelFor(priorityOptions, data.priority)),
    ]),
    block('Principal blocage', [data.blocker]),
    block('Message', [data.message || null]),
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject: `Diagnostic — ${data.company} (${data.area})`,
    text,
  };
}

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
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject: `Contact — ${data.fullName}`,
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
  kind: 'diagnostic' | 'contact',
  data: { readonly fullName: string; readonly email: string },
  options: { readonly replyTo: string | null; readonly siteUrl: string },
) {
  const intro =
    kind === 'diagnostic'
      ? 'Nous avons bien reçu votre demande de diagnostic.'
      : 'Nous avons bien reçu votre message.';

  const text = [
    `Bonjour ${data.fullName},`,
    '',
    intro,
    '',
    kind === 'diagnostic'
      ? 'Nous allons lire vos réponses, puis nous vous écrivons à cette adresse avec ce que nous avons vu et ce que nous proposons d’examiner ensemble.'
      : 'Nous vous répondons à cette adresse.',
    '',
    options.replyTo
      ? `Si vous souhaitez ajouter quelque chose, répondez simplement à cet e-mail ou écrivez à ${options.replyTo}.`
      : 'Si vous souhaitez ajouter quelque chose, répondez simplement à cet e-mail.',
    '',
    '—',
    'Qualifyr Agence',
    'Nettoyage automobile mobile et conciergeries',
    options.siteUrl,
  ].join('\n');

  return {
    subject:
      kind === 'diagnostic'
        ? 'Votre demande de diagnostic — Qualifyr Agence'
        : 'Votre message — Qualifyr Agence',
    text,
  };
}
