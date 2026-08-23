/**
 * Variables d'environnement du produit detailing.
 * Une variable manquante dégrade la fonctionnalité, elle ne casse pas le site.
 */

function read(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export type DetailingPublicEnv = {
  readonly url: string;
  readonly anonKey: string;
};

/** Utilisable côté serveur comme côté navigateur : soumise aux policies RLS. */
export function detailingPublicEnv(): DetailingPublicEnv | null {
  const url = read('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = read('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export type DetailingServiceEnv = {
  readonly url: string;
  readonly serviceRoleKey: string;
};

/** Serveur uniquement. Contourne RLS — ne jamais importer depuis un composant client. */
export function detailingServiceEnv(): DetailingServiceEnv | null {
  const url = read('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = read('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

/** Clé Resend pour les emails de réservation. */
export function resendApiKey(): string | null {
  return read('RESEND_API_KEY');
}

/**
 * Email de secours pour notifier le detailer (tests / demo)
 * si la fiche detailer n'a pas d'email.
 */
export function bookingNotifyEmail(): string | null {
  return read('BOOKING_NOTIFY_EMAIL');
}
