import { Resend } from 'resend';
import { vehicleSizeCopy, scopeCopy, soilingCopy, optionCopy } from '@/components/detailing/content';
import type { LocationMode, OptionKey, Scope, SoilingLevel, VehicleSize } from './types';

/**
 * Emails de réservation via Resend.
 * Échec silencieux côté client (la réservation reste valide),
 * mais log serveur pour le debug.
 */

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

function fromAddress(): string {
  return readEnv('BOOKING_FROM_EMAIL') ?? 'Qualifyr <onboarding@resend.dev>';
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
        `<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top">${r.label}</td><td style="padding:6px 0;font-weight:500">${r.value}</td></tr>`,
    )
    .join('');
  return `<!DOCTYPE html><html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
  <p style="margin:0 0 20px;color:#333">${intro}</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px">${list}</table>
  <p style="margin:24px 0 0;color:#333">${outro}</p>
  <p style="margin:16px 0 0;color:#888;font-size:13px">— Qualifyr</p>
</body></html>`;
}

export async function sendClientBookingEmail(payload: BookingEmailPayload): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const title = 'Demande enregistrée';
  const intro = `Votre demande de réservation avec ${payload.detailerName} a bien été enregistrée.`;
  const outro = 'Le professionnel va la traiter. Vous serez recontacté si besoin.';

  try {
    const { error } = await resend.emails.send({
      from: fromAddress(),
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
      from: fromAddress(),
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
