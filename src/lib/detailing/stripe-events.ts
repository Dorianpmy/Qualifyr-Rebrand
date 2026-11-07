/**
 * Lecture des événements Stripe du webhook des acomptes — `docs/13` §2.5.
 *
 * Module pur : il traduit un événement déjà authentifié (signature vérifiée par
 * la route) en une action, sans toucher à la base. La route applique ensuite
 * l'action, après avoir vérifié que le compte connecté de l'événement est bien
 * celui du professionnel de la réservation.
 *
 * **Pourquoi `event.account` est exigé.** Les acomptes sont encaissés sur le
 * compte du professionnel (en-tête `Stripe-Account`). Leurs événements portent
 * donc toujours l'identifiant de ce compte. Un événement sans `account` vient du
 * compte Qualifyr lui-même : ce n'est jamais un acompte, il est ignoré.
 */

export type DepositEventAction =
  | { readonly kind: 'ignore'; readonly reason: string }
  | {
      readonly kind: 'confirm';
      readonly account: string;
      readonly bookingId: string;
      readonly paymentIntentId: string | null;
    }
  | { readonly kind: 'expire'; readonly account: string; readonly bookingId: string }
  | { readonly kind: 'sync_account'; readonly account: string; readonly chargesEnabled: boolean };

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function bookingIdOf(session: UnknownRecord): string | null {
  return asString(asRecord(session['metadata'])?.['booking_id']);
}

export function classifyDepositEvent(raw: unknown): DepositEventAction {
  const event = asRecord(raw);
  if (!event) return { kind: 'ignore', reason: 'evenement_illisible' };

  const type = asString(event['type']);
  const account = asString(event['account']);
  const object = asRecord(asRecord(event['data'])?.['object']);

  if (!type || !object) return { kind: 'ignore', reason: 'evenement_illisible' };
  if (!account) return { kind: 'ignore', reason: 'hors_compte_connecte' };

  switch (type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const bookingId = bookingIdOf(object);
      if (!bookingId) return { kind: 'ignore', reason: 'sans_reservation' };
      /*
       * `completed` arrive aussi pour un moyen de paiement différé (virement
       * SEPA…) encore impayé : seul `paid` confirme. Le paiement différé
       * réussi arrive ensuite en `async_payment_succeeded`, déjà payé.
       */
      if (object['payment_status'] !== 'paid') {
        return { kind: 'ignore', reason: 'paiement_en_cours' };
      }
      return {
        kind: 'confirm',
        account,
        bookingId,
        paymentIntentId: asString(object['payment_intent']),
      };
    }

    case 'checkout.session.expired': {
      const bookingId = bookingIdOf(object);
      if (!bookingId) return { kind: 'ignore', reason: 'sans_reservation' };
      return { kind: 'expire', account, bookingId };
    }

    case 'account.updated': {
      // L'objet est le compte lui-même : son identifiant doit être celui de
      // l'événement, sinon l'événement est incohérent.
      if (asString(object['id']) !== account) {
        return { kind: 'ignore', reason: 'compte_incoherent' };
      }
      return {
        kind: 'sync_account',
        account,
        chargesEnabled: object['charges_enabled'] === true,
      };
    }

    default:
      return { kind: 'ignore', reason: 'type_non_traite' };
  }
}
