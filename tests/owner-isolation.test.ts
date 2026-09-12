import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Isolation entre propriétaires — ce qui est réellement testable ici.
 *
 * **Ce que ce fichier prouve.** Que chaque lecture et chaque écriture
 * concernée applique bien un filtre sur l'identifiant du propriétaire. Le
 * client Supabase est remplacé par un double qui enregistre les filtres
 * reçus : on vérifie donc la requête réellement construite, pas l'intention
 * du code.
 *
 * **Ce que ce fichier ne prouve pas, et qu'aucun test hors base ne peut
 * prouver.** Que PostgreSQL applique bien ces filtres, que les politiques RLS
 * de la migration 015 sont correctes, et qu'aucun autre chemin d'accès
 * n'existe. Ces trois points demandent une base réelle et figurent comme tels
 * dans le plan de validation (`docs/13`).
 *
 * Le double couvre la partie de l'interface Supabase que ce code utilise :
 * `from().select().eq().eq().maybeSingle()` et
 * `from().update().eq().eq()`. Toute méthode non couverte fait échouer le
 * test plutôt que de renvoyer `undefined` en silence — un double trop
 * permissif ferait passer un code qui ne filtre rien.
 */

type Filter = { readonly column: string; readonly value: unknown };

/** Enregistre les appels pour qu'on puisse les inspecter après coup. */
class QueryRecorder {
  filters: Filter[] = [];
  table = '';
  operation = '';
  result: { data: unknown; error: unknown } = { data: null, error: null };

  from(table: string) {
    this.table = table;
    return this;
  }

  select(_columns: string) {
    this.operation = 'select';
    return this;
  }

  update(_values: unknown) {
    this.operation = 'update';
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  order(_column: string, _options?: unknown) {
    return this;
  }

  limit(_count: number) {
    return this;
  }

  maybeSingle() {
    return Promise.resolve(this.result);
  }

  /** `update()` se résout sans `maybeSingle()` : le double doit être « thenable ». */
  then(resolve: (value: { data: unknown; error: unknown }) => unknown) {
    return Promise.resolve(this.result).then(resolve);
  }

  /** Le filtre porte-t-il sur cette colonne, avec cette valeur ? */
  filtered(column: string, value: unknown): boolean {
    return this.filters.some((f) => f.column === column && f.value === value);
  }
}

let recorder: QueryRecorder;

vi.mock('@/lib/detailing/supabase-server', () => ({
  getServiceSupabaseClient: () => recorder,
}));

vi.mock('server-only', () => ({}));

const OWNER_A = 'aaaaaaaa-0000-0000-0000-000000000001';
const OWNER_B = 'bbbbbbbb-0000-0000-0000-000000000002';
const BOOKING_OF_B = 'cccccccc-0000-0000-0000-000000000003';

beforeEach(() => {
  recorder = new QueryRecorder();
});

describe('isolation : lecture', () => {
  it('l’abonnement est toujours lu avec un filtre sur owner_id', async () => {
    recorder.result = { data: [], error: null };
    const { getEntitlement } = await import('../src/lib/billing/subscription');

    await getEntitlement(OWNER_A);

    expect(recorder.table).toBe('subscriptions');
    expect(recorder.filtered('owner_id', OWNER_A)).toBe(true);
    // Le propriétaire B ne doit jamais apparaître dans une requête faite pour A.
    expect(recorder.filtered('owner_id', OWNER_B)).toBe(false);
  });

  it('une réservation d’un autre propriétaire n’est pas reconnue comme sienne', async () => {
    // La base ne renvoie rien : la conjonction des deux filtres n'a pas de
    // correspondance, ce qui est exactement le cas d'un identifiant volé.
    recorder.result = { data: null, error: null };
    const { bookingBelongsToDetailer } = await import('../src/lib/detailing/dashboard');

    const owns = await bookingBelongsToDetailer(BOOKING_OF_B, OWNER_A);

    expect(owns).toBe(false);
    expect(recorder.filtered('id', BOOKING_OF_B)).toBe(true);
    expect(recorder.filtered('detailer_id', OWNER_A)).toBe(true);
    // Les deux filtres, pas un seul : c'est leur conjonction qui protège.
    expect(recorder.filters.length).toBe(2);
  });

  it('une réservation qui lui appartient est bien reconnue', async () => {
    recorder.result = { data: { id: BOOKING_OF_B }, error: null };
    const { bookingBelongsToDetailer } = await import('../src/lib/detailing/dashboard');

    expect(await bookingBelongsToDetailer(BOOKING_OF_B, OWNER_A)).toBe(true);
  });

  it('une erreur de base ne vaut jamais autorisation', async () => {
    recorder.result = { data: { id: BOOKING_OF_B }, error: { message: 'panne' } };
    const { bookingBelongsToDetailer } = await import('../src/lib/detailing/dashboard');

    expect(await bookingBelongsToDetailer(BOOKING_OF_B, OWNER_A)).toBe(false);
  });
});

describe('isolation : écriture', () => {
  it('un changement de statut filtre sur le detailer ET sur la réservation', async () => {
    recorder.result = { data: null, error: null };
    const { updateBookingStatus } = await import('../src/lib/detailing/dashboard');

    await updateBookingStatus(OWNER_A, BOOKING_OF_B, 'confirme');

    expect(recorder.table).toBe('detailer_bookings');
    expect(recorder.operation).toBe('update');
    expect(recorder.filtered('detailer_id', OWNER_A)).toBe(true);
    expect(recorder.filtered('id', BOOKING_OF_B)).toBe(true);
    // Sans le filtre sur `detailer_id`, n'importe qui modifierait n'importe
    // quelle réservation en connaissant son identifiant.
    expect(recorder.filters.length).toBe(2);
  });

  it('un statut non autorisé est refusé avant toute requête', async () => {
    const { updateBookingStatus } = await import('../src/lib/detailing/dashboard');

    const result = await updateBookingStatus(OWNER_A, BOOKING_OF_B, 'admin' as never);

    expect(result.ok).toBe(false);
    expect(recorder.filters.length).toBe(0);
  });

  it('la confirmation manuelle d’un acompte filtre sur le detailer, la réservation et le statut', async () => {
    // docs/18-options-paiement-acompte.md §4 : même isolation que
    // `updateBookingStatus`, plus la garde de statut qui rend l'opération
    // idempotente (même principe que `stripe-webhook/route.ts`).
    recorder.result = { data: null, error: null };
    const { confirmDepositManually } = await import('../src/lib/detailing/dashboard');
    const CONFIRMING_USER = 'dddddddd-0000-0000-0000-000000000004';

    await confirmDepositManually(OWNER_A, BOOKING_OF_B, CONFIRMING_USER);

    expect(recorder.table).toBe('detailer_bookings');
    expect(recorder.operation).toBe('update');
    expect(recorder.filtered('detailer_id', OWNER_A)).toBe(true);
    expect(recorder.filtered('id', BOOKING_OF_B)).toBe(true);
    expect(recorder.filtered('status', 'en_attente_paiement')).toBe(true);
    // Les trois filtres, pas moins : sans celui sur `detailer_id`, n'importe
    // qui confirmerait n'importe quelle réservation ; sans celui sur
    // `status`, une réservation déjà annulée ailleurs redeviendrait confirmée.
    expect(recorder.filters.length).toBe(3);
  });
});
