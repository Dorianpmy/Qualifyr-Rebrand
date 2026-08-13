import { Resend } from 'resend';
import { vehicleSizeCopy, scopeCopy, soilingCopy, optionCopy } from '@/components/detailing/content';
import type { LocationMode, OptionKey, Scope, SoilingLevel, VehicleSize } from './types';

/**
 * Envoi des emails de réservation via Resend.
 *
 * Si RESEND_API_KEY est absent, les envois sont ignorés (la réservation reste valide).
 * En test sans domaine vérifié : FROM = onboarding@resend.dev
 * et les destinataires limités à l'email du compte Resend.
 */

function readEnv(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getResend(): Resend | null {
  const key = readEnv('RESEND_API_KEY');
  if (!key) return null;
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

function formatPrice(centsOrEuros: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(centsOrEuros);
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

function summaryLines(p: BookingEmailPayload): string {
  return [
    `Professionnel : ${p.detailerName}`,
    `Créneau : ${formatSlot(p.slotStart)}`,
    `Véhicule : ${vehicleSizeCopy[p.vehicleSize].label}${p.vehicleModel ? ` · ${p.vehicleModel}` : ''}${p.plate ? ` · ${p.plate}` : ''}`,
    `Formule : ${scopeCopy[p.scope].label}`,
    `État : ${soilingCopy[p.soiling].label}`,
    `Options : ${optionsLabel(p.optionKeys)}`,
    `Lieu : ${locationLabel(p.locationMode, p.postalCode)}`,
    `Durée estimée : ${p.quotedMinutes} min`,
    `Montant : ${formatPrice(p.quotedPrice)}`,
    p.depositAmount > 0 ? `Acompte : ${formatPrice(p.depositAmount)}` : null,
    `Réf. : ${p.bookingId}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Email au client — confirmation de demande. */
export async function sendClientBookingEmail(payload: BookingEmailPayload): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const text = [
    `Bonjour,`,
    ``,
    `Votre demande de réservation avec ${payload.detailerName} a bien été enregistrée.`,
    ``,
    summaryLines(payload),
    ``,
    `Le professionnel va la traiter. Vous serez recontacté si besoin.`,
    ``,
    `— Qualifyr`,
  ].join('\n');

  try {
    const { error } = await resend.emails.send({
      from: fromAddress(),
      to: payload.clientEmail,
      subject: `Demande enregistrée — ${payload.detailerName}`,
      text,
    });
    return !error;
  } catch {
    return false;
  }
}

/** Email au detailer — nouvelle demande. */
export async function sendDetailerBookingEmail(payload: BookingEmailPayload): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const to =
    payload.detailerEmail?.trim() ||
    readEnv('BOOKING_NOTIFY_EMAIL') ||
    null;

  if (!to) return false;

  const text = [
    `Nouvelle demande de réservation`,
    ``,
    `Client : ${payload.clientEmail}${payload.clientPhone ? ` · ${payload.clientPhone}` : ''}`,
    ``,
    summaryLines(payload),
    ``,
    `Connectez-vous à votre espace pour confirmer ou ajuster.`,
    ``,
    `— Qualifyr`,
  ].join('\n');

  try {
    const { error } = await resend.emails.send({
      from: fromAddress(),
      to,
      subject: `Nouvelle réservation — ${formatSlot(payload.slotStart)}`,
      text,
    });
    return !error;
  } catch {
    return false;
  }
}

/** Envoie les deux mails sans faire échouer la réservation. */
export async function notifyBookingEmails(payload: BookingEmailPayload): Promise<void> {
  await Promise.allSettled([
    sendClientBookingEmail(payload),
    sendDetailerBookingEmail(payload),
  ]);
}
