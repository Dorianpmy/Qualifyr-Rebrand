import 'server-only';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { detailingPublicEnv, detailingServiceEnv } from './env';

const COOKIE_ACCESS = 'sb-access-token';
const COOKIE_REFRESH = 'sb-refresh-token';

/**
 * Session dashboard — tokens stockés en cookies httpOnly après magic link.
 * V1 simple sans @supabase/ssr ; à migrer plus tard si besoin multi-onglets.
 */

export async function getSessionUser(): Promise<{ id: string; email: string } | null> {
  const jar = await cookies();
  const access = jar.get(COOKIE_ACCESS)?.value;
  const refresh = jar.get(COOKIE_REFRESH)?.value;
  if (!access) return null;

  const env = detailingPublicEnv();
  if (!env) return null;

  const client = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${access}` } },
  });

  const { data, error } = await client.auth.getUser(access);
  if (error || !data.user) {
    // Tentative de refresh
    if (refresh) {
      const refreshed = await client.auth.refreshSession({ refresh_token: refresh });
      if (refreshed.data.session?.access_token && refreshed.data.user) {
        return {
          id: refreshed.data.user.id,
          email: refreshed.data.user.email ?? '',
        };
      }
    }
    return null;
  }

  return { id: data.user.id, email: data.user.email ?? '' };
}

export async function setSessionCookies(accessToken: string, refreshToken: string) {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  jar.set(COOKIE_ACCESS, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  jar.set(COOKIE_REFRESH, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.delete(COOKIE_ACCESS);
  jar.delete(COOKIE_REFRESH);
}

/** Envoie un magic link. */
export async function sendMagicLink(email: string, redirectTo: string): Promise<{ ok: boolean; message: string }> {
  const env = detailingPublicEnv();
  if (!env) return { ok: false, message: 'Supabase non configuré.' };

  const client = createClient(env.url, env.anonKey, {
    auth: { persistSession: false },
  });

  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Lien envoyé. Vérifiez votre boîte mail.' };
}

/** Échange le token du magic link contre une session. */
export async function exchangeMagicToken(tokenHash: string, type: string) {
  const env = detailingServiceEnv() ?? detailingPublicEnv();
  if (!env) return null;

  const key = 'serviceRoleKey' in env ? (env as { serviceRoleKey: string }).serviceRoleKey : (env as { anonKey: string }).anonKey;
  const client = createClient(env.url, key, {
    auth: { persistSession: false },
  });

  const { data, error } = await client.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as 'email' | 'magiclink',
  });

  if (error || !data.session) return null;
  return data.session;
}
