/**
 * Invitation calendrier (.ics), jointe aux e-mails de réservation.
 *
 * Pas de `import 'server-only'` ici, à la différence de `whatsapp.ts` : ce
 * module ne lit aucune variable d'environnement ni secret, seulement du
 * formatage de texte pur — rien qui doive être exclu d'un bundle client.
 *
 * Demande de Dorian (16/09/2026), après avoir vu à quoi ressemblaient les
 * e-mails de confirmation : qu'un client (et le professionnel) puisse ajouter
 * le rendez-vous à son agenda en un geste, sur iOS comme sur Samsung/Android.
 *
 * **Format minimal RFC 5545, sans dépendance.** Un `.ics` est un texte brut —
 * aucune bibliothèque n'apporte grand-chose face au risque d'une dépendance
 * de plus à maintenir pour une trentaine de lignes de gabarit. Ouvert
 * nativement par Gmail, Outlook, Apple Mail et l'application Email de
 * Samsung : chacun propose « Ajouter au calendrier » à l'ouverture de la
 * pièce jointe, sans application tierce.
 *
 * **Absent de la relance de devis abandonné.** `sendAbandonedBookingEmail`
 * (plus bas dans `email.ts`) n'a pas de créneau confirmé à proposer — le
 * client n'a encore ni payé ni engagé le créneau, une invitation calendrier à
 * ce stade prétendrait un rendez-vous qui n'existe pas encore.
 */

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** `YYYYMMDDTHHmmssZ`, le format de date/heure exigé par la norme, en UTC. */
function formatIcsDate(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
}

export function buildBookingIcs(input: {
  readonly uid: string;
  readonly start: Date;
  readonly durationMinutes: number;
  readonly summary: string;
  readonly description: string;
  readonly location: string;
}): string {
  const end = new Date(input.start.getTime() + input.durationMinutes * 60_000);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Qualifyr//Reservation//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.uid}@qualifyragence.com`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(input.start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(input.summary)}`,
    `DESCRIPTION:${escapeIcsText(input.description)}`,
    `LOCATION:${escapeIcsText(input.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  // CRLF exigé par la norme (RFC 5545 §3.1) — un simple `\n` est toléré par
  // la plupart des clients mais pas garanti par tous.
  return lines.join('\r\n');
}
