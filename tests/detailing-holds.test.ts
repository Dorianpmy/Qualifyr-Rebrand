import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CHECKOUT_HOLD_MINUTES,
  CHECKOUT_SESSION_MINUTES,
  expireStaleHolds,
  holdUntil,
  HOLD_MINUTES,
  isOccupyingSlot,
  onlineDepositApplies,
} from '@/lib/detailing/holds';

/**
 * Blocage de créneau pendant le paiement — `docs/13` §2.5.
 *
 * Avant le 07/11/2026, aucune réservation ne passait jamais en `expire` : un
 * panier abandonné bloquait le créneau pour toujours. Ces tests fixent les
 * règles qui l'empêchent désormais.
 */

const NOW = new Date('2026-11-07T10:00:00Z');

describe('isOccupyingSlot', () => {
  it('une réservation confirmée ou ajustée occupe toujours son créneau', () => {
    expect(isOccupyingSlot({ status: 'confirme', holdExpiresAt: null }, NOW)).toBe(true);
    expect(isOccupyingSlot({ status: 'ajuste', holdExpiresAt: '2026-11-07T09:00:00Z' }, NOW)).toBe(
      true,
    );
  });

  it('une réservation en attente dont le blocage court occupe son créneau', () => {
    expect(
      isOccupyingSlot({ status: 'en_attente_paiement', holdExpiresAt: '2026-11-07T10:05:00Z' }, NOW),
    ).toBe(true);
  });

  it('une réservation en attente dont le blocage est dépassé libère son créneau', () => {
    // Le cas qui bloquait l'agenda indéfiniment.
    expect(
      isOccupyingSlot({ status: 'en_attente_paiement', holdExpiresAt: '2026-11-07T09:59:59Z' }, NOW),
    ).toBe(false);
    // Borne exacte : à l'instant d'expiration, le créneau est libre.
    expect(
      isOccupyingSlot({ status: 'en_attente_paiement', holdExpiresAt: NOW.toISOString() }, NOW),
    ).toBe(false);
  });

  it('une demande sans blocage (mode manuel, pas d’acompte) occupe le créneau jusqu’à décision', () => {
    expect(isOccupyingSlot({ status: 'en_attente_paiement', holdExpiresAt: null }, NOW)).toBe(true);
  });

  it('une date de blocage illisible garde le créneau occupé plutôt que de risquer un doublon', () => {
    expect(isOccupyingSlot({ status: 'en_attente_paiement', holdExpiresAt: 'pas une date' }, NOW)).toBe(
      true,
    );
  });

  it('les réservations annulées, expirées ou réalisées ne comptent plus', () => {
    for (const status of ['annule', 'expire', 'realise']) {
      expect(isOccupyingSlot({ status, holdExpiresAt: '2026-11-07T11:00:00Z' }, NOW)).toBe(false);
    }
  });
});

describe('onlineDepositApplies', () => {
  const base = {
    paymentMode: 'stripe',
    stripeChargesEnabled: true,
    depositEnabled: true,
    depositAmount: 30,
    depositCapability: true,
  } as const;

  it('vrai seulement quand toutes les conditions du paiement en ligne sont réunies', () => {
    expect(onlineDepositApplies(base)).toBe(true);
  });

  it('un mode de paiement absent vaut Stripe, comme la valeur par défaut de la migration 024', () => {
    expect(onlineDepositApplies({ ...base, paymentMode: null })).toBe(true);
  });

  it('faux en mode manuel : il n’y a pas de paiement en ligne à attendre (docs/18 §5)', () => {
    expect(onlineDepositApplies({ ...base, paymentMode: 'manuel' })).toBe(false);
  });

  it('faux sans compte Stripe actif, sans acompte, ou sans la capacité d’abonnement', () => {
    expect(onlineDepositApplies({ ...base, stripeChargesEnabled: false })).toBe(false);
    expect(onlineDepositApplies({ ...base, depositEnabled: false })).toBe(false);
    expect(onlineDepositApplies({ ...base, depositAmount: 0 })).toBe(false);
    expect(onlineDepositApplies({ ...base, depositCapability: false })).toBe(false);
  });
});

describe('durées de blocage', () => {
  it('la session Stripe respecte le minimum de trente minutes imposé par Stripe', () => {
    expect(CHECKOUT_SESSION_MINUTES).toBeGreaterThanOrEqual(30);
  });

  it('le blocage pendant le paiement dure plus longtemps que la session', () => {
    // Sinon un client pourrait payer un créneau déjà rendu à un autre.
    expect(CHECKOUT_HOLD_MINUTES).toBeGreaterThan(CHECKOUT_SESSION_MINUTES);
  });

  it('holdUntil ajoute la durée en minutes', () => {
    expect(holdUntil(HOLD_MINUTES, NOW)).toBe('2026-11-07T10:15:00.000Z');
  });
});

/**
 * Faux client Supabase : enregistre la chaîne d'appels de la requête
 * d'expiration, pour vérifier ce qui part réellement en base.
 */
function fakeClient(result: { data: { id: string }[] | null; error: unknown }) {
  const calls: [string, ...unknown[]][] = [];
  const builder: Record<string, (...args: unknown[]) => unknown> = {};
  for (const method of ['update', 'eq', 'lt']) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, ...args]);
      return builder;
    };
  }
  builder['select'] = (...args: unknown[]) => {
    calls.push(['select', ...args]);
    return Promise.resolve(result);
  };
  const client = {
    from: (table: string) => {
      calls.push(['from', table]);
      return builder;
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

describe('expireStaleHolds', () => {
  it('passe en expire les seules réservations en attente au blocage dépassé', async () => {
    const { client, calls } = fakeClient({ data: [{ id: 'a' }, { id: 'b' }], error: null });

    const count = await expireStaleHolds(client, { now: NOW });

    expect(count).toBe(2);
    expect(calls).toContainEqual(['from', 'detailer_bookings']);
    expect(calls).toContainEqual(['update', { status: 'expire' }]);
    expect(calls).toContainEqual(['eq', 'status', 'en_attente_paiement']);
    // `lt` exclut les blocages nuls : le mode manuel n'expire jamais.
    expect(calls).toContainEqual(['lt', 'hold_expires_at', NOW.toISOString()]);
    expect(calls.some((call) => call[0] === 'eq' && call[1] === 'detailer_id')).toBe(false);
  });

  it('se limite à un professionnel quand il est précisé', async () => {
    const { client, calls } = fakeClient({ data: [], error: null });

    await expireStaleHolds(client, { detailerId: 'det-1', now: NOW });

    expect(calls).toContainEqual(['eq', 'detailer_id', 'det-1']);
  });

  it('renvoie null quand la base refuse, sans lever', async () => {
    const original = console.error;
    console.error = () => {};
    try {
      const { client } = fakeClient({ data: null, error: { message: 'boom' } });
      expect(await expireStaleHolds(client, { now: NOW })).toBeNull();
    } finally {
      console.error = original;
    }
  });
});
