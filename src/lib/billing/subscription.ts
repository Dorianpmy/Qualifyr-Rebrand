import 'server-only';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import type { Entitlement } from './entitlements';
import { isPlan, isSubscriptionStatus } from './plans';

/**
 * Lecture de l'abonnement d'un compte.
 *
 * **Séparé de `entitlements.ts` à dessein.** Ce fichier touche la base ; celui
 * des permissions non. La règle d'accès reste ainsi testable sans base, et la
 * lecture reste remplaçable sans toucher à la règle.
 *
 * **Clé de service, pas clé publique.** La politique RLS n'autorise la lecture
 * qu'à `auth.uid()`, or ces appels tournent côté serveur avec un
 * identifiant déjà vérifié par `getSessionUser()`, sans session Postgres. La
 * clé de service contourne RLS — d'où le filtre explicite sur `owner_id` : il
 * n'est pas décoratif, c'est lui qui empêche de lire l'abonnement d'un autre.
 */

/**
 * Abonnement courant d'un compte, ou `null`.
 *
 * **Le plus pertinent d'abord.** Un compte peut porter plusieurs lignes :
 * l'abonnement en cours, plus l'historique des résiliés (jamais supprimés).
 * Le tri place les statuts vivants en tête, puis la ligne la plus récente —
 * la contrainte d'unicité de la migration 015 garantit qu'il n'y a jamais
 * plus d'un abonnement vivant, donc ce tri est déterministe.
 *
 * Renvoie `null` si la base est injoignable : refuser l'accès pendant une
 * panne est préférable à l'accorder.
 */
export async function getEntitlement(ownerId: string): Promise<Entitlement | null> {
  const client = getServiceSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('subscriptions')
    .select('plan, status, current_period_end, trial_ends_at, cancel_at_period_end')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data || data.length === 0) return null;

  const live = data.find((row) =>
    ['trialing', 'active', 'past_due'].includes(String(row.status)),
  );
  const row = live ?? data[0];
  if (!row) return null;

  // Une valeur hors contrainte ne peut venir que d'une donnée corrompue ou
  // d'une migration non appliquée. On refuse plutôt que de deviner : un plan
  // illisible ne doit pas ouvrir de droits.
  if (!isPlan(row.plan) || !isSubscriptionStatus(row.status)) return null;

  return {
    plan: row.plan,
    status: row.status,
    currentPeriodEnd: (row.current_period_end as string | null) ?? null,
    trialEndsAt: (row.trial_ends_at as string | null) ?? null,
    cancelAtPeriodEnd: row.cancel_at_period_end === true,
  };
}
