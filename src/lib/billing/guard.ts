import 'server-only';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/detailing/session';
import { canAccess, denialReason, type Capability, type Entitlement } from './entitlements';
import { getEntitlement } from './subscription';

/**
 * Garde d'accès réutilisable pour les routes d'API.
 *
 * **Pourquoi un helper et pas un middleware Next.** Le middleware s'exécute
 * sur l'Edge, où ni `getSessionUser` (qui interroge Supabase) ni la lecture de
 * l'abonnement ne peuvent tourner. Il faudrait y dupliquer la vérification du
 * jeton, donc entretenir deux implémentations de la même règle — la façon la
 * plus sûre de les faire diverger. Une fonction appelée en tête de chaque
 * route garde une seule implémentation, au prix d'un appel explicite.
 *
 * **Ce contrôle est le seul qui protège.** Masquer un module dans l'interface
 * n'empêche personne d'appeler l'URL à la main : sans ce garde, un abonné
 * « Agent seul » atteindrait `/api/app/invoices` par un simple `fetch`.
 */

export type GuardFailure = { readonly response: NextResponse };
export type GuardSuccess = {
  readonly user: { readonly id: string; readonly email: string };
  readonly entitlement: Entitlement;
};

/** Message affiché au client, par cause de refus. Jamais de détail interne. */
function messageFor(reason: ReturnType<typeof denialReason>): string {
  switch (reason) {
    case 'no-subscription':
      return 'Aucun abonnement actif sur ce compte.';
    case 'plan-excludes':
      return 'Cette fonctionnalité n’est pas incluse dans votre abonnement.';
    case 'read-only':
      return 'Votre abonnement est résilié : la consultation reste possible, pas la modification.';
    case 'payment-required':
      return 'Votre abonnement n’est pas à jour. Régularisez le paiement pour retrouver l’accès.';
    default:
      return 'Accès refusé.';
  }
}

/**
 * Exige une session et une capacité.
 *
 * Renvoie soit `{ response }` — à retourner tel quel par la route —, soit
 * `{ user, entitlement }`.
 *
 * - `401` si personne n'est connecté ;
 * - `403` si le compte est connecté mais n'a pas le droit.
 *
 * La distinction compte : un `403` dit au client qu'il est bien identifié et
 * qu'il lui manque un plan, ce qui permet à l'interface de proposer une montée
 * en gamme au lieu de le renvoyer à l'écran de connexion.
 *
 * Le corps JSON reste volontairement pauvre — une cause et un message. Il
 * n'expose ni le plan requis, ni l'existence de la ressource : de quoi
 * afficher un écran juste, rien de plus.
 */
export async function requireCapability(
  capability: Capability,
  options?: { readonly write?: boolean },
): Promise<GuardFailure | GuardSuccess> {
  const user = await getSessionUser();
  if (!user) {
    return {
      response: NextResponse.json(
        { error: 'unauthenticated', message: 'Connectez-vous pour continuer.' },
        { status: 401 },
      ),
    };
  }

  const entitlement = await getEntitlement(user.id);

  if (!canAccess(entitlement, capability, options)) {
    const reason = denialReason(entitlement, capability, options);
    return {
      response: NextResponse.json(
        { error: 'forbidden', reason, message: messageFor(reason) },
        { status: 403 },
      ),
    };
  }

  // `canAccess` a déjà écarté le cas `null` ; l'assertion ne fait que le dire
  // au typage.
  return { user, entitlement: entitlement as Entitlement };
}

/** Vrai si le résultat du garde est un refus. */
export function isGuardFailure(
  result: GuardFailure | GuardSuccess,
): result is GuardFailure {
  return 'response' in result;
}

/**
 * Variante sans session : le droit du **propriétaire d'une fiche**, pas celui
 * de l'appelant.
 *
 * Nécessaire pour les routes publiques et planifiées, où il n'y a personne à
 * authentifier mais où un droit doit malgré tout être vérifié. Le cas type est
 * le paiement d'acompte : c'est le client final qui appelle la route, alors
 * que le droit d'encaisser appartient au professionnel. Sans cette
 * vérification, un professionnel abonné « Agent seul » encaisserait des
 * acomptes qu'il n'a pas payés — il lui suffirait de faire réserver quelqu'un
 * sur sa page publique.
 *
 * Refuse en cas de doute : fiche introuvable, fiche sans propriétaire, base
 * injoignable.
 */
export async function detailerHasCapability(
  detailerId: string,
  capability: Capability,
  options?: { readonly write?: boolean },
): Promise<boolean> {
  return ownerHasCapability({ column: 'id', value: detailerId, capability, ...options });
}

/**
 * Même contrôle, à partir du `slug` public d'un professionnel.
 *
 * Les routes du parcours client ne connaissent que le slug de l'URL, jamais
 * l'identifiant interne. Résoudre le slug d'abord puis appeler la variante
 * par identifiant aurait doublé les allers-retours en base pour rien.
 */
export async function detailerHasCapabilityBySlug(
  slug: string,
  capability: Capability,
  options?: { readonly write?: boolean },
): Promise<boolean> {
  return ownerHasCapability({ column: 'slug', value: slug, capability, ...options });
}

async function ownerHasCapability(input: {
  readonly column: 'id' | 'slug';
  readonly value: string;
  readonly capability: Capability;
  readonly write?: boolean;
}): Promise<boolean> {
  const { getServiceSupabaseClient } = await import('@/lib/detailing/supabase-server');
  const client = getServiceSupabaseClient();
  if (!client) return false;

  const { data, error } = await client
    .from('detailers')
    .select('owner_id')
    .eq(input.column, input.value)
    .maybeSingle();

  if (error || !data?.owner_id) return false;

  const entitlement = await getEntitlement(String(data.owner_id));
  return canAccess(entitlement, input.capability, { write: input.write ?? true });
}
