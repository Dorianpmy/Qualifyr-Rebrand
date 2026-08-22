import 'server-only';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/detailing/session';
import { canAccess, denialReason, type Capability, type Entitlement } from './entitlements';
import { getEntitlement } from './subscription';

/**
 * Garde d'accès pour les pages serveur.
 *
 * Pendant du `requireCapability` des routes d'API, avec deux différences
 * dictées par le contexte :
 *
 * - **une page redirige, une API répond.** Un visiteur non connecté doit
 *   arriver sur l'écran de connexion, pas recevoir un JSON `401` ;
 * - **un refus de droit n'est pas une erreur à afficher, mais un écran à
 *   rendre.** La page continue donc son rendu avec `LockedModule`, qui
 *   explique. C'est pourquoi cette fonction renvoie une cause plutôt que de
 *   lever.
 *
 * Ce garde ne remplace jamais celui des routes : la page appelle des API, et
 * ce sont elles qui protègent les données. Ici, on protège l'affichage.
 */
export type PageAccess =
  | {
      readonly allowed: true;
      readonly user: { readonly id: string; readonly email: string };
      readonly entitlement: Entitlement;
    }
  | {
      readonly allowed: false;
      readonly reason: NonNullable<ReturnType<typeof denialReason>>;
      readonly user: { readonly id: string; readonly email: string };
      readonly entitlement: Entitlement | null;
    };

export async function pageAccess(
  capability: Capability,
  options?: { readonly write?: boolean },
): Promise<PageAccess> {
  const user = await getSessionUser();
  // `redirect` lève : rien ne s'exécute après.
  if (!user) redirect('/app/login');

  const entitlement = await getEntitlement(user.id);

  // Les pages sont consultées, pas modifiées : un abonnement résilié doit
  // pouvoir afficher ses factures. Les actions de la page, elles, passent par
  // des routes d'API qui exigent l'écriture.
  const write = options?.write ?? false;

  if (canAccess(entitlement, capability, { write })) {
    return { allowed: true, user, entitlement: entitlement as Entitlement };
  }

  return {
    allowed: false,
    reason: denialReason(entitlement, capability, { write }) ?? 'no-subscription',
    user,
    entitlement,
  };
}
