import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Blocage de créneau pendant le paiement de l'acompte — `docs/13` §2.5.
 *
 * Une réservation naît en `en_attente_paiement`. Si l'acompte se paie en ligne
 * (Stripe), elle porte un `hold_expires_at` : passé ce délai sans paiement, elle
 * ne doit plus occuper l'agenda. Sinon (mode manuel, pas d'acompte), le blocage
 * est nul et la demande occupe le créneau jusqu'à la décision du professionnel.
 *
 * Ce module ne dépend ni de React ni de `server-only` : les fonctions pures sont
 * testées seules, et `expireStaleHolds` reçoit son client Supabase en argument.
 */

/** Délai pour atteindre la page de paiement après validation du formulaire. */
export const HOLD_MINUTES = 15;

/**
 * Durée de vie d'une session Stripe Checkout. Stripe impose au moins trente
 * minutes entre la création et `expires_at`.
 */
export const CHECKOUT_SESSION_MINUTES = 30;

/**
 * Blocage posé à l'ouverture du paiement : une minute de plus que la session,
 * pour qu'un paiement validé à la dernière seconde trouve encore son créneau.
 */
export const CHECKOUT_HOLD_MINUTES = CHECKOUT_SESSION_MINUTES + 1;

/** Statuts qui comptent dans la contrainte d'exclusion (`docs/13` §2.4). */
const HOLDING_STATUSES = new Set(['confirme', 'ajuste']);

export type HoldState = {
  readonly status: string;
  /** ISO, ou `null` quand la réservation n'a pas de blocage limité dans le temps. */
  readonly holdExpiresAt: string | null;
};

/**
 * Cette réservation occupe-t-elle encore son créneau à l'instant `now` ?
 *
 * Une réservation en attente dont le blocage est dépassé n'occupe plus rien,
 * même si aucune tâche ne l'a encore passée en `expire` : le client suivant
 * doit voir le créneau libre sans attendre le passage du planificateur.
 */
export function isOccupyingSlot(state: HoldState, now: Date = new Date()): boolean {
  if (HOLDING_STATUSES.has(state.status)) return true;
  if (state.status !== 'en_attente_paiement') return false;
  if (state.holdExpiresAt === null) return true;

  const expiresAt = new Date(state.holdExpiresAt).getTime();
  // Date illisible : on garde le créneau occupé plutôt que de risquer un
  // double rendez-vous.
  if (Number.isNaN(expiresAt)) return true;
  return expiresAt > now.getTime();
}

export type OnlineDepositInput = {
  readonly paymentMode: string | null | undefined;
  readonly stripeChargesEnabled: boolean;
  readonly depositEnabled: boolean;
  readonly depositAmount: number;
  /** Capacité `payments.deposit` de l'abonnement du professionnel. */
  readonly depositCapability: boolean;
};

/**
 * L'acompte de cette réservation se paiera-t-il en ligne, par Stripe ?
 *
 * C'est la seule situation où un blocage limité dans le temps a un sens : il
 * existe un paiement à attendre. Le mode de paiement absent vaut `stripe`, comme
 * dans `booking-public.ts` (valeur par défaut de la migration 024).
 */
export function onlineDepositApplies(input: OnlineDepositInput): boolean {
  const mode = input.paymentMode === 'manuel' ? 'manuel' : 'stripe';
  return (
    mode === 'stripe' &&
    input.stripeChargesEnabled &&
    input.depositEnabled &&
    input.depositAmount > 0 &&
    input.depositCapability
  );
}

/** `now + minutes`, en ISO. */
export function holdUntil(minutes: number, now: Date = new Date()): string {
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

/**
 * Passe en `expire` les réservations en attente dont le blocage est dépassé.
 *
 * Appelée avant chaque nouvelle réservation (pour un seul professionnel) et par
 * la tâche planifiée (pour tous). `lt` exclut d'office les blocages nuls : une
 * demande en mode manuel n'expire jamais ici.
 *
 * Renvoie le nombre de lignes passées en `expire`, ou `null` si la mise à jour a
 * échoué — l'appelant décide si c'est bloquant.
 */
export async function expireStaleHolds(
  client: SupabaseClient,
  options: { readonly detailerId?: string; readonly now?: Date } = {},
): Promise<number | null> {
  const now = (options.now ?? new Date()).toISOString();

  let query = client
    .from('detailer_bookings')
    .update({ status: 'expire' })
    .eq('status', 'en_attente_paiement')
    .lt('hold_expires_at', now);

  if (options.detailerId) {
    query = query.eq('detailer_id', options.detailerId);
  }

  const { data, error } = await query.select('id');
  if (error) {
    console.error('[holds] expiration impossible', error);
    return null;
  }
  return data?.length ?? 0;
}
