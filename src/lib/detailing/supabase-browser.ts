import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { detailingPublicEnv } from './env';

let cachedClient: SupabaseClient | null = null;

/**
 * Client soumis aux policies RLS — lecture des fiches publiées, dépôt de
 * réservation par un visiteur, dépôt de photo dans le bucket privé.
 *
 * N'utilise que des variables `NEXT_PUBLIC_*` : sûr à importer depuis un
 * composant client comme depuis le serveur.
 */
export function getPublicSupabaseClient(): SupabaseClient | null {
  const env = detailingPublicEnv();
  if (!env) return null;
  cachedClient ??= createClient(env.url, env.anonKey, {
    auth: { persistSession: false },
  });
  return cachedClient;
}
