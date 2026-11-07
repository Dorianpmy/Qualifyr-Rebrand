import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { classifyDepositEvent } from '@/lib/detailing/stripe-events';
import type * as StripeModule from '@/lib/detailing/stripe';

vi.mock('server-only', () => ({}));

/**
 * Webhook des acomptes — `docs/13` §2.5.
 *
 * Les acomptes sont encaissés sur le compte Stripe du professionnel : leurs
 * événements portent `account`. Ces tests fixent trois garanties :
 *
 * - un événement d'un autre compte que celui de la réservation ne confirme rien ;
 * - un webhook en retard, arrivé après expiration, confirme encore la
 *   réservation si le créneau est libre, et rembourse sinon ;
 * - `checkout.session.expired` libère le créneau.
 *
 * La signature est calculée ici, indépendamment de `verifyWebhookSignature`.
 */

const SECRET = 'whsec_test_acomptes';
const ACCOUNT = 'acct_pro_1';

async function stripeSignature(payload: string, timestamp: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `t=${timestamp},v1=${hex}`;
}

async function signedRequest(event: unknown): Promise<Request> {
  const payload = JSON.stringify(event);
  const signature = await stripeSignature(payload, Math.floor(Date.now() / 1000));
  return new Request('https://qualifyragence.com/api/detailing/stripe-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
    body: payload,
  });
}

function sessionEvent(
  type: string,
  overrides: { account?: string | undefined; paymentStatus?: string; bookingId?: string } = {},
) {
  return {
    type,
    ...(overrides.account === undefined && 'account' in overrides ? {} : { account: overrides.account ?? ACCOUNT }),
    data: {
      object: {
        id: 'cs_1',
        payment_intent: 'pi_1',
        payment_status: overrides.paymentStatus ?? 'paid',
        metadata: { booking_id: overrides.bookingId ?? 'booking-1' },
      },
    },
  };
}

describe('classifyDepositEvent', () => {
  it('confirme une session payée sur un compte connecté', () => {
    expect(classifyDepositEvent(sessionEvent('checkout.session.completed'))).toEqual({
      kind: 'confirm',
      account: ACCOUNT,
      bookingId: 'booking-1',
      paymentIntentId: 'pi_1',
    });
  });

  it('attend le paiement différé au lieu de confirmer une session impayée', () => {
    expect(
      classifyDepositEvent(sessionEvent('checkout.session.completed', { paymentStatus: 'unpaid' })),
    ).toEqual({ kind: 'ignore', reason: 'paiement_en_cours' });
    expect(classifyDepositEvent(sessionEvent('checkout.session.async_payment_succeeded')).kind).toBe(
      'confirm',
    );
  });

  it('ignore un événement sans compte connecté : ce n’est jamais un acompte', () => {
    expect(
      classifyDepositEvent(sessionEvent('checkout.session.completed', { account: undefined })),
    ).toEqual({ kind: 'ignore', reason: 'hors_compte_connecte' });
  });

  it('traduit l’expiration de session et la mise à jour du compte', () => {
    expect(classifyDepositEvent(sessionEvent('checkout.session.expired'))).toEqual({
      kind: 'expire',
      account: ACCOUNT,
      bookingId: 'booking-1',
    });
    expect(
      classifyDepositEvent({
        type: 'account.updated',
        account: ACCOUNT,
        data: { object: { id: ACCOUNT, charges_enabled: true } },
      }),
    ).toEqual({ kind: 'sync_account', account: ACCOUNT, chargesEnabled: true });
  });

  it('ignore un compte mis à jour dont l’identifiant ne correspond pas à l’événement', () => {
    expect(
      classifyDepositEvent({
        type: 'account.updated',
        account: ACCOUNT,
        data: { object: { id: 'acct_autre', charges_enabled: true } },
      }).kind,
    ).toBe('ignore');
  });

  it('ignore les types non traités et les contenus illisibles', () => {
    expect(classifyDepositEvent(sessionEvent('payment_intent.created')).kind).toBe('ignore');
    expect(classifyDepositEvent(null).kind).toBe('ignore');
    expect(classifyDepositEvent({ type: 'checkout.session.completed' }).kind).toBe('ignore');
  });
});

/**
 * Faux client Supabase minimal : lectures `maybeSingle` servies depuis des
 * tables en mémoire, mises à jour enregistrées et résolues avec `updateResult`.
 */
function fakeSupabase(options: {
  bookingDetailer?: string | null;
  detailerAccount?: string | null;
  updateResult?: { error: { code?: string; message: string } | null };
}) {
  const updates: { table: string; values: unknown; filters: unknown[][] }[] = [];

  function from(table: string) {
    const filters: unknown[][] = [];
    let values: unknown = null;
    const builder = {
      select: () => builder,
      update: (next: unknown) => {
        values = next;
        return builder;
      },
      eq: (...args: unknown[]) => {
        filters.push(['eq', ...args]);
        return builder;
      },
      in: (...args: unknown[]) => {
        filters.push(['in', ...args]);
        return builder;
      },
      maybeSingle: async () => {
        if (table === 'detailer_bookings') {
          return {
            data: options.bookingDetailer ? { detailer_id: options.bookingDetailer } : null,
            error: null,
          };
        }
        return {
          data:
            options.detailerAccount === undefined
              ? null
              : { stripe_account_id: options.detailerAccount },
          error: null,
        };
      },
      then: (resolve: (value: unknown) => unknown) => {
        updates.push({ table, values, filters });
        return Promise.resolve(options.updateResult ?? { error: null }).then(resolve);
      },
    };
    return builder;
  }

  return { client: { from }, updates };
}

describe('POST /api/detailing/stripe-webhook', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.doUnmock('@/lib/detailing/supabase-server');
    vi.doUnmock('@/lib/detailing/stripe');
  });

  async function loadRoute(
    supabase: ReturnType<typeof fakeSupabase> | null,
    refund = vi.fn(async () => ({ id: 're_1' })),
  ) {
    vi.resetModules();
    vi.doMock('@/lib/detailing/supabase-server', () => ({
      getServiceSupabaseClient: () => supabase?.client ?? null,
    }));
    const actual = await vi.importActual<typeof StripeModule>(
      '@/lib/detailing/stripe',
    );
    vi.doMock('@/lib/detailing/stripe', () => ({ ...actual, refundDeposit: refund }));
    const { POST } = await import('@/app/api/detailing/stripe-webhook/route');
    return { POST, refund };
  }

  it('refuse une signature invalide', async () => {
    const { POST } = await loadRoute(fakeSupabase({}));
    const request = new Request('https://qualifyragence.com/api/detailing/stripe-webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 't=1,v1=00' },
      body: '{}',
    });
    expect((await POST(request)).status).toBe(400);
  });

  it('acquitte sans toucher à la base un événement hors compte connecté', async () => {
    // Base absente : si la route l'atteignait, elle répondrait 503.
    const { POST } = await loadRoute(null);
    const response = await POST(
      await signedRequest(sessionEvent('checkout.session.completed', { account: undefined })),
    );
    expect(response.status).toBe(200);
  });

  it('ne confirme pas une réservation qui appartient à un autre compte', async () => {
    const supabase = fakeSupabase({ bookingDetailer: 'det-1', detailerAccount: 'acct_autre' });
    const { POST } = await loadRoute(supabase);

    const response = await POST(await signedRequest(sessionEvent('checkout.session.completed')));

    expect(response.status).toBe(200);
    expect(supabase.updates).toHaveLength(0);
  });

  it('confirme depuis en attente ou expirée, et retire le blocage', async () => {
    const supabase = fakeSupabase({ bookingDetailer: 'det-1', detailerAccount: ACCOUNT });
    const { POST } = await loadRoute(supabase);

    const response = await POST(await signedRequest(sessionEvent('checkout.session.completed')));

    expect(response.status).toBe(200);
    expect(supabase.updates).toHaveLength(1);
    const [update] = supabase.updates;
    expect(update?.values).toMatchObject({
      status: 'confirme',
      stripe_payment_intent_id: 'pi_1',
      hold_expires_at: null,
    });
    expect(update?.filters).toContainEqual(['in', 'status', ['en_attente_paiement', 'expire']]);
  });

  it('rembourse quand le créneau a été repris avant la confirmation', async () => {
    const supabase = fakeSupabase({
      bookingDetailer: 'det-1',
      detailerAccount: ACCOUNT,
      updateResult: { error: { code: '23P01', message: 'conflicting key value' } },
    });
    const { POST, refund } = await loadRoute(supabase);

    const response = await POST(await signedRequest(sessionEvent('checkout.session.completed')));

    expect(response.status).toBe(200);
    expect(refund).toHaveBeenCalledWith({ accountId: ACCOUNT, paymentIntentId: 'pi_1' });
  });

  it('demande à Stripe de réessayer si le remboursement échoue', async () => {
    const supabase = fakeSupabase({
      bookingDetailer: 'det-1',
      detailerAccount: ACCOUNT,
      updateResult: { error: { code: '23P01', message: 'conflicting key value' } },
    });
    const { POST } = await loadRoute(
      supabase,
      vi.fn(async () => {
        throw new Error('Stripe indisponible');
      }),
    );

    const response = await POST(await signedRequest(sessionEvent('checkout.session.completed')));
    expect(response.status).toBe(500);
  });

  it('libère le créneau à l’expiration de la session, sans toucher une réservation payée', async () => {
    const supabase = fakeSupabase({ bookingDetailer: 'det-1', detailerAccount: ACCOUNT });
    const { POST } = await loadRoute(supabase);

    const response = await POST(await signedRequest(sessionEvent('checkout.session.expired')));

    expect(response.status).toBe(200);
    const [update] = supabase.updates;
    expect(update?.values).toEqual({ status: 'expire' });
    expect(update?.filters).toContainEqual(['eq', 'status', 'en_attente_paiement']);
  });

  it('recopie charges_enabled du compte connecté', async () => {
    const supabase = fakeSupabase({});
    const { POST } = await loadRoute(supabase);

    const response = await POST(
      await signedRequest({
        type: 'account.updated',
        account: ACCOUNT,
        data: { object: { id: ACCOUNT, charges_enabled: false } },
      }),
    );

    expect(response.status).toBe(200);
    const [update] = supabase.updates;
    expect(update?.table).toBe('detailers');
    expect(update?.values).toEqual({ stripe_charges_enabled: false });
    expect(update?.filters).toContainEqual(['eq', 'stripe_account_id', ACCOUNT]);
  });
});
