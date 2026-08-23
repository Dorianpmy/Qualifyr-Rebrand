import { Resend } from 'resend';
import { isProduction } from '@/lib/env';
import { vehicleSizeCopy, scopeCopy, soilingCopy, optionCopy } from '@/components/detailing/content';
import type { LocationMode, OptionKey, Scope, SoilingLevel, VehicleSize } from './types';

/**
 * Emails de réservation via Resend.
 * Échec silencieux côté client (la réservation reste valide),
 * mais log serveur pour le debug.
 */

/*
 * Échappement HTML des valeurs injectées dans les gabarits d'e-mail.
 *
 * `vehicleModel`, `plate`, `detailerName`, `clientEmail`... viennent de
 * champs remplis par un visiteur du formulaire public ou par un professionnel
 * dans ses réglages — jamais validés pour être du texte inerte. Sans
 * échappement, un modèle de véhicule du genre `<img src=x onerror=...>`
 * s'exécuterait dans le client mail du destinataire, qui croirait lire un
 * message de confiance signé « Qualifyr ». Appliqué systématiquement, même
 * aux valeurs déjà sûres (labels fixes, montants formatés) : l'échappement
 * en trop est invisible, l'échappement manquant est une faille.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readEnv(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getResend(): Resend | null {
  const key = readEnv('RESEND_API_KEY');
  if (!key) {
    console.warn('[booking-email] RESEND_API_KEY manquante — emails désactivés');
    return null;
  }
  return new Resend(key);
}

/**
 * Adresse d'expédition Resend.
 *
 * **Aucun repli en production.** `onboarding@resend.dev` accepte l'envoi —
 * Resend ne renvoie aucune erreur — mais ce domaine partagé ne livre qu'au
 * propriétaire du compte Resend : un client qui vient de réserver ne
 * recevrait jamais sa confirmation, sans qu'aucune erreur ne le signale
 * nulle part. `null` oblige l'appelant à refuser explicitement l'envoi,
 * exactement comme `getResend()` le fait déjà pour une clé API absente.
 * Hors production, le repli reste utile pour dérouler le parcours sans
 * configuration — même principe que `resolveTransport()` dans
 * `lib/email/transport.ts`.
 */
function fromAddress(): string | null {
  const configured = readEnv('BOOKING_FROM_EMAIL');
  if (configured) return configured;
  return isProduction() ? null : 'Qualifyr <onboarding@resend.dev>';
}

/** Résout l'adresse d'expédition, ou journalise et refuse l'envoi. */
function requireFromAddress(context: string): string | null {
  const from = fromAddress();
  if (!from) {
    console.error(`[booking-email] BOOKING_FROM_EMAIL manquante — envoi ${context} refusé`);
  }
  return from;
}

export type BookingEmailPayload = {
  readonly bookingId: string;
  readonly detailerName: string;
  readonly detailerEmail?: string | null;
  readonly clientEmail: string;
  readonly clientPhone?: string | undefined;
  readonly vehicleSize: VehicleSize;
  readonly vehicleModel?: string | undefined;
  readonly plate?: string | undefined;
  readonly scope: Scope;
  readonly soiling: SoilingLevel;
  readonly optionKeys: readonly OptionKey[];
  readonly locationMode: LocationMode;
  readonly postalCode?: string | undefined;
  readonly slotStart: string;
  readonly quotedPrice: number;
  readonly quotedMinutes: number;
  readonly depositAmount: number;
};

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatSlot(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function optionsLabel(keys: readonly OptionKey[]): string {
  if (keys.length === 0) return 'Aucune';
  return keys.map((k) => optionCopy[k]?.label ?? k).join(', ');
}

function locationLabel(mode: LocationMode, postalCode?: string): string {
  if (mode === 'atelier') return 'Atelier';
  return postalCode ? `Domicile · ${postalCode}` : 'Domicile';
}

function rows(payload: BookingEmailPayload): { label: string; value: string }[] {
  return [
    { label: 'Professionnel', value: payload.detailerName },
    { label: 'Créneau', value: formatSlot(payload.slotStart) },
    {
      label: 'Véhicule',
      value: [
        vehicleSizeCopy[payload.vehicleSize].label,
        payload.vehicleModel,
        payload.plate,
      ]
        .filter(Boolean)
        .join(' · '),
    },
    { label: 'Formule', value: scopeCopy[payload.scope].label },
    { label: 'État', value: soilingCopy[payload.soiling].label },
    { label: 'Options', value: optionsLabel(payload.optionKeys) },
    { label: 'Lieu', value: locationLabel(payload.locationMode, payload.postalCode) },
    { label: 'Durée estimée', value: `${payload.quotedMinutes} min` },
    { label: 'Montant', value: formatPrice(payload.quotedPrice) },
    ...(payload.depositAmount > 0
      ? [{ label: 'Acompte', value: formatPrice(payload.depositAmount) }]
      : []),
    { label: 'Référence', value: payload.bookingId },
  ];
}

function textBody(title: string, intro: string, payload: BookingEmailPayload, outro: string): string {
  const lines = rows(payload).map((r) => `${r.label} : ${r.value}`);
  return [title, '', intro, '', ...lines, '', outro, '', '— Qualifyr'].join('\n');
}

function htmlBody(title: string, intro: string, payload: BookingEmailPayload, outro: string): string {
  const list = rows(payload)
    .map(
      (r) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top">${escapeHtml(r.label)}</td><td style="padding:6px 0;font-weight:500">${escapeHtml(r.value)}</td></tr>`,
    )
    .join('');
  /*
   * `title`/`intro`/`outro` arrivent en clair (ce sont les mêmes chaînes que
   * `textBody` reçoit, qui elle ne doit rien échapper). Elles mélangent texte
   * statique et données utilisateur (`payload.detailerName`, `clientEmail`...)
   * — échapper la chaîne composée entière est plus sûr que de traquer quelle
   * portion vient de l'utilisateur à chaque appel.
   */
  return `<!DOCTYPE html><html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(title)}</h1>
  <p style="margin:0 0 20px;color:#333">${escapeHtml(intro)}</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px">${list}</table>
  <p style="margin:24px 0 0;color:#333">${escapeHtml(outro)}</p>
  <p style="margin:16px 0 0;color:#888;font-size:13px">— Qualifyr</p>
</body></html>`;
}

export async function sendClientBookingEmail(payload: BookingEmailPayload): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;
  const from = requireFromAddress('client');
  if (!from) return false;

  const title = 'Demande enregistrée';
  const intro = `Votre demande de réservation avec ${payload.detailerName} a bien été enregistrée.`;
  const outro = 'Le professionnel va la traiter. Vous serez recontacté si besoin.';

  try {
    const { error } = await resend.emails.send({
      from,
      to: payload.clientEmail,
      subject: `Demande enregistrée — ${payload.detailerName}`,
      text: textBody(title, intro, payload, outro),
      html: htmlBody(title, intro, payload, outro),
    });
    if (error) {
      console.error('[booking-email] client failed', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[booking-email] client exception', err);
    return false;
  }
}

export async function sendDetailerBookingEmail(payload: BookingEmailPayload): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;
  const from = requireFromAddress('detailer');
  if (!from) return false;

  const to = payload.detailerEmail?.trim() || readEnv('BOOKING_NOTIFY_EMAIL') || null;
  if (!to) {
    console.warn('[booking-email] aucun destinataire detailer (email fiche ou BOOKING_NOTIFY_EMAIL)');
    return false;
  }

  const title = 'Nouvelle demande de réservation';
  const intro = `Client : ${payload.clientEmail}${payload.clientPhone ? ` · ${payload.clientPhone}` : ''}`;
  const outro = 'Connectez-vous à votre espace pour confirmer ou ajuster.';

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `Nouvelle réservation — ${formatSlot(payload.slotStart)}`,
      text: textBody(title, intro, payload, outro),
      html: htmlBody(title, intro, payload, outro),
    });
    if (error) {
      console.error('[booking-email] detailer failed', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[booking-email] detailer exception', err);
    return false;
  }
}

export async function notifyBookingEmails(payload: BookingEmailPayload): Promise<void> {
  await Promise.allSettled([sendClientBookingEmail(payload), sendDetailerBookingEmail(payload)]);
}

/*
 * Relance d'un devis abandonné.
 *
 * Plus courte que les autres gabarits : elle ne reprend pas le détail du
 * véhicule ou de la formule (le client les a déjà vus une fois), seulement ce
 * qui pousse à finir — le montant, et un lien direct vers le paiement. Les
 * deux montants sont déjà formatés en amont (`formatMoney` de `locale.ts`) :
 * ce module ne connaît pas le pays de la réservation, seulement le texte à
 * afficher.
 */

export type AbandonedBookingEmailPayload = {
  readonly clientEmail: string;
  readonly detailerName: string;
  readonly quotedPriceLabel: string;
  readonly depositLabel: string;
  readonly recoveryUrl: string;
};

export async function sendAbandonedBookingEmail(
  payload: AbandonedBookingEmailPayload,
): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;
  const from = requireFromAddress('relance');
  if (!from) return false;

  const subject = `Votre créneau avec ${payload.detailerName} est encore disponible`;
  const text = [
    subject,
    '',
    `Vous avez commencé une demande auprès de ${payload.detailerName} (${payload.quotedPriceLabel}), mais le créneau n’a pas été confirmé.`,
    '',
    `Réglez l’acompte de ${payload.depositLabel} pour le garder : ${payload.recoveryUrl}`,
    '',
    'Si vous n’êtes plus intéressé, ignorez simplement ce message — rien ne sera débité.',
    '',
    '— Qualifyr',
  ].join('\n');

  // `detailerName` vient d'une fiche modifiable par le professionnel,
  // `recoveryUrl` est reconstruite ici mais reste une donnée externe au
  // module — les deux sont échappées avant d'entrer dans le HTML.
  const safeDetailerName = escapeHtml(payload.detailerName);
  const safeRecoveryUrl = escapeHtml(payload.recoveryUrl);

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;margin:0 0 12px">Votre créneau est encore disponible</h1>
  <p style="margin:0 0 20px;color:#333">
    Vous avez commencé une demande auprès de <strong>${safeDetailerName}</strong>
    (${escapeHtml(payload.quotedPriceLabel)}), mais le créneau n’a pas été confirmé.
  </p>
  <p style="margin:0 0 24px">
    <a href="${safeRecoveryUrl}" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#0e0e0f;color:#fff;text-decoration:none;font-weight:600">
      Payer l’acompte de ${escapeHtml(payload.depositLabel)}
    </a>
  </p>
  <p style="margin:0;color:#888;font-size:13px">
    Si vous n’êtes plus intéressé, ignorez simplement ce message — rien ne sera débité.
  </p>
  <p style="margin:16px 0 0;color:#888;font-size:13px">— Qualifyr</p>
</body></html>`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: payload.clientEmail,
      subject,
      text,
      html,
    });
    if (error) {
      console.error('[booking-email] abandon failed', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[booking-email] abandon exception', err);
    return false;
  }
}
