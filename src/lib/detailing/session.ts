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

/**
 * Crée un compte avec e-mail et mot de passe.
 *
 * **Remplace le lien magique comme unique porte d'entrée (12/09/2026).** Le
 * lien magique évitait de choisir un mot de passe, mais dépendait d'un aller-
 * retour e-mail à chaque connexion et s'est révélé fragile en pratique (la
 * redirection Supabase doit être exactement autorisée dans le projet, sans
 * quoi elle échoue en silence). Un mot de passe choisi à l'inscription règle
 * les deux problèmes à la fois : on se reconnecte sans e-mail, et il ne reste
 * qu'un seul lien e-mail à faire fonctionner correctement — celui de
 * confirmation, pas celui de chaque connexion.
 *
 * **La confirmation d'identité vient de Supabase, pas d'une case cochée.**
 * Tant que le lien reçu par e-mail n'est pas ouvert, `signUp` ne renvoie aucune
 * session : le compte existe mais reste inutilisable. C'est exactement ce qui
 * garantit que l'adresse saisie appartient bien à qui crée le compte.
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  redirectTo: string,
): Promise<{ ok: boolean; message: string }> {
  const env = detailingPublicEnv();
  if (!env) return { ok: false, message: 'Supabase non configuré.' };

  const client = createClient(env.url, env.anonKey, {
    auth: { persistSession: false },
  });

  const { error } = await client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return {
      ok: false,
      message:
        error.message === 'User already registered'
          ? 'Un compte existe déjà pour cette adresse. Connectez-vous plutôt.'
          : error.message,
    };
  }

  /* Supabase renvoie un succès sans erreur, même pour une adresse déjà
     confirmée par ailleurs — protection anti-énumération intégrée qui évite
     de révéler qui a déjà un compte. Le message reste donc le même dans tous
     les cas : personne n'apprend ici si l'adresse existait déjà. */
  return {
    ok: true,
    message: 'Compte créé. Ouvrez l’e-mail de confirmation pour l’activer.',
  };
}

/**
 * Envoie un lien de définition de mot de passe.
 *
 * **Le formulaire de connexion proposait un mot de passe que personne ne
 * pouvait créer.** `login-password` vérifiait un mot de passe depuis le
 * début, mais aucun écran n'en définissait : le champ était donc un cul-de-sac
 * pour tout compte né d'un lien magique — c'est-à-dire tous. Signalé le
 * 01/09/2026 par le premier utilisateur réel, qui a cru avoir raté une étape.
 *
 * **La réponse ne dit jamais si l'adresse existe.** `resetPasswordForEmail`
 * renvoie une erreur explicite pour un compte inconnu ; la relayer
 * transformerait cet écran en outil d'énumération, permettant de tester des
 * adresses une à une pour savoir qui est client. Le message est donc le même
 * dans les deux cas, et l'erreur ne part qu'en journal serveur.
 */
export async function sendPasswordReset(
  email: string,
  redirectTo: string,
): Promise<{ ok: boolean; message: string }> {
  const env = detailingPublicEnv();
  if (!env) return { ok: false, message: 'Supabase non configuré.' };

  const client = createClient(env.url, env.anonKey, {
    auth: { persistSession: false },
  });

  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) console.warn('[auth] réinitialisation impossible', error.message);

  return {
    ok: true,
    message:
      'Si un compte existe pour cette adresse, un lien de définition de mot de passe vient d’être envoyé.',
  };
}

/**
 * Définit le mot de passe du compte connecté.
 *
 * Suppose une session valide : elle vient soit du lien de récupération (que
 * `/app/auth/confirm` a déjà échangé contre des cookies), soit d'un
 * professionnel déjà connecté qui veut en changer. Dans les deux cas,
 * l'ancienne valeur n'est pas demandée — Supabase considère la possession
 * d'une session comme la preuve, et redemander un mot de passe qu'on vient
 * justement d'oublier n'aurait pas de sens.
 */
export async function setPassword(
  accessToken: string,
  password: string,
): Promise<{ ok: boolean; message: string }> {
  const env = detailingPublicEnv();
  if (!env) return { ok: false, message: 'Supabase non configuré.' };

  const client = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { error } = await client.auth.updateUser({ password });
  if (error) {
    console.warn('[auth] définition du mot de passe impossible', error.message);
    return { ok: false, message: 'Définition impossible. Le lien a peut-être expiré.' };
  }

  return { ok: true, message: 'Mot de passe enregistré.' };
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
