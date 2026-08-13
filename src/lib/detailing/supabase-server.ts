import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { detailingServiceEnv } from './env';

/**
 * Client à privilèges — contourne RLS. Un nouveau client à chaque appel,
 * jamais mis en cache dans un module partagé : ce module est protégé par
 * `server-only`, qui fait échouer le build si un composant client l'importe
 * par erreur.
 */
export function getServiceSupabaseClient(): SupabaseClient | null {
  const env = detailingServiceEnv();
  if (!env) return null;
  return createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false },
  });
}
