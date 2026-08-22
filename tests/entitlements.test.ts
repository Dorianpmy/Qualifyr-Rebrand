import { describe, expect, it } from 'vitest';
import {
  CAPABILITIES,
  canAccess,
  capabilitiesOf,
  denialReason,
  landingPathFor,
  planIncludes,
  plansWith,
  type Capability,
  type Entitlement,
} from '../src/lib/billing/entitlements';
import {
  intervalFromStripe,
  planFromStripe,
  statusFromStripe,
  type Plan,
  type SubscriptionStatus,
} from '../src/lib/billing/plans';
import {
  buildSubscriptionRow,
  planByPriceIdFromEnv,
  subscriptionIdFromEvent,
} from '../src/lib/billing/provisioning';

/**
 * Tests du contrôle d'accès.
 *
 * **Ils portent sur la règle, pas sur les routes.** La décision d'autoriser
 * vit entièrement dans `canAccess`, une fonction pure : la tester ne demande
 * ni base, ni réseau, ni serveur, et couvre exactement ce qui pourrait
 * s'ouvrir par erreur. Les gardes de routes n'ajoutent rien à cette décision —
 * ils la transportent (`requireCapability` appelle `canAccess` et traduit le
 * refus en 401/403).
 *
 * Ce qui reste hors de portée de ces tests est dit dans le rapport : la
 * vérification de bout en bout d'un appel HTTP réel demande un environnement
 * Supabase et Stripe, absent de cette suite.
 */

function sub(plan: Plan, status: SubscriptionStatus = 'active'): Entitlement {
  return {
    plan,
    status,
    currentPeriodEnd: null,
    trialEndsAt: null,
    cancelAtPeriodEnd: false,
  };
}

const SYSTEM_ONLY: readonly Capability[] = [
  'dashboard',
  'planning',
  'services',
  'booking.public',
  'payments.deposit',
  'invoices',
  'gallery',
  'booking.recovery',
];

const AGENT_ONLY: readonly Capability[] = ['agent.prospecting', 'agent.report'];

describe('matrice des permissions', () => {
  it('1. le plan Agent n’accède à aucun module du système', () => {
    const entitlement = sub('agent');
    for (const capability of SYSTEM_ONLY) {
      expect(canAccess(entitlement, capability), capability).toBe(false);
    }
  });

  it('1 bis. le plan Agent accède bien à ses deux capacités', () => {
    const entitlement = sub('agent');
    for (const capability of AGENT_ONLY) {
      expect(canAccess(entitlement, capability), capability).toBe(true);
    }
  });

  it('2. le plan Agent n’accède pas aux factures', () => {
    // Le scénario « appel direct de l'API » : la garde de route appelle
    // exactement cette fonction, avec exactement ces valeurs.
    expect(canAccess(sub('agent'), 'invoices')).toBe(false);
    expect(denialReason(sub('agent'), 'invoices')).toBe('plan-excludes');
  });

  it('3. le plan Système n’accède à aucune capacité de l’agent', () => {
    const entitlement = sub('system');
    for (const capability of AGENT_ONLY) {
      expect(canAccess(entitlement, capability), capability).toBe(false);
    }
  });

  it('4. le plan Complet accède à toutes les capacités', () => {
    const entitlement = sub('complete');
    for (const capability of CAPABILITIES) {
      expect(canAccess(entitlement, capability), capability).toBe(true);
    }
  });

  it('la matrice couvre exactement les capacités déclarées', () => {
    // Empêche qu'une capacité soit ajoutée à la liste sans être attribuée à
    // aucun plan — elle serait alors refusée partout, en silence.
    const covered = new Set(capabilitiesOf('complete'));
    for (const capability of CAPABILITIES) {
      expect(covered.has(capability), capability).toBe(true);
    }
  });
});

describe('refus par défaut', () => {
  it('5. aucun abonnement : tout est refusé', () => {
    for (const capability of CAPABILITIES) {
      expect(canAccess(null, capability), capability).toBe(false);
      expect(canAccess(undefined, capability), capability).toBe(false);
    }
    expect(denialReason(null, 'dashboard')).toBe('no-subscription');
  });

  it('un plan inconnu est refusé, même sur une capacité existante', () => {
    const corrupted = { ...sub('complete'), plan: 'illimite' as Plan };
    expect(canAccess(corrupted, 'dashboard')).toBe(false);
  });

  it('une capacité inconnue est refusée, même avec le plan le plus large', () => {
    expect(canAccess(sub('complete'), 'admin.everything' as Capability)).toBe(false);
  });
});

describe('statuts d’abonnement', () => {
  it('trialing et active ouvrent l’accès', () => {
    expect(canAccess(sub('system', 'trialing'), 'dashboard')).toBe(true);
    expect(canAccess(sub('system', 'active'), 'dashboard')).toBe(true);
  });

  it('past_due maintient l’accès — période de grâce assumée', () => {
    expect(canAccess(sub('system', 'past_due'), 'dashboard')).toBe(true);
  });

  it('6. canceled passe en lecture seule : consultation oui, écriture non', () => {
    const canceled = sub('system', 'canceled');
    expect(canAccess(canceled, 'invoices', { write: false })).toBe(true);
    expect(canAccess(canceled, 'invoices')).toBe(false);
    expect(canAccess(canceled, 'invoices', { write: true })).toBe(false);
    expect(denialReason(canceled, 'invoices')).toBe('read-only');
  });

  it('unpaid, incomplete et incomplete_expired bloquent tout', () => {
    for (const status of ['unpaid', 'incomplete', 'incomplete_expired'] as const) {
      expect(canAccess(sub('system', status), 'dashboard', { write: false }), status).toBe(
        false,
      );
      expect(canAccess(sub('system', status), 'dashboard'), status).toBe(false);
    }
  });

  it('l’écriture est refusée par défaut, sans option explicite', () => {
    // Un appel négligent ne doit pas ouvrir plus qu'un appel explicite.
    const canceled = sub('complete', 'canceled');
    expect(canAccess(canceled, 'dashboard')).toBe(false);
  });
});

describe('redirection à la connexion', () => {
  it('un abonné Agent seul arrive sur la prospection, pas sur un écran verrouillé', () => {
    expect(landingPathFor(sub('agent'))).toBe('/app/prospection');
  });

  it('un abonné Système ou Complet arrive sur le tableau de bord', () => {
    expect(landingPathFor(sub('system'))).toBe('/app');
    expect(landingPathFor(sub('complete'))).toBe('/app');
  });

  it('sans abonnement, on arrive sur la page d’abonnement', () => {
    expect(landingPathFor(null)).toBe('/app/abonnement');
    expect(landingPathFor(sub('system', 'unpaid'))).toBe('/app/abonnement');
  });
});

describe('quel plan débloque quoi', () => {
  it('plansWith répond pour chaque capacité', () => {
    expect(plansWith('invoices')).toEqual(['system', 'complete']);
    expect(plansWith('agent.report')).toEqual(['agent', 'complete']);
  });

  it('planIncludes ignore le statut', () => {
    expect(planIncludes('agent', 'agent.report')).toBe(true);
    expect(planIncludes('agent', 'invoices')).toBe(false);
  });
});

describe('traduction des valeurs Stripe', () => {
  it('accepte les identifiants français historiques et canoniques', () => {
    expect(planFromStripe('agent')).toBe('agent');
    expect(planFromStripe('systeme')).toBe('system');
    expect(planFromStripe('system')).toBe('system');
    expect(planFromStripe('complet')).toBe('complete');
    expect(planFromStripe('complete')).toBe('complete');
  });

  it('refuse toute autre valeur plutôt que de choisir un plan par défaut', () => {
    expect(planFromStripe('premium')).toBeNull();
    expect(planFromStripe('')).toBeNull();
    expect(planFromStripe(undefined)).toBeNull();
    expect(planFromStripe(42)).toBeNull();
  });

  it('ramène un statut inconnu à incomplete, le plus restrictif non terminal', () => {
    expect(statusFromStripe('active')).toBe('active');
    expect(statusFromStripe('paused')).toBe('incomplete');
    expect(statusFromStripe(undefined)).toBe('incomplete');
  });

  it('reconnaît les deux vocabulaires de périodicité', () => {
    expect(intervalFromStripe('year')).toBe('year');
    expect(intervalFromStripe('annual')).toBe('year');
    expect(intervalFromStripe('month')).toBe('month');
    expect(intervalFromStripe(undefined)).toBe('month');
  });
});

describe('provisioning depuis un événement Stripe', () => {
  const subscriptionEvent = {
    id: 'sub_123',
    customer: 'cus_123',
    status: 'active',
    current_period_start: 1_760_000_000,
    current_period_end: 1_762_678_400,
    metadata: { plan: 'complet', cadence: 'annual' },
    items: { data: [{ price: { id: 'price_abc', recurring: { interval: 'year' } } }] },
  };

  it('7. un paiement Stripe produit une ligne d’abonnement exploitable', () => {
    const built = buildSubscriptionRow({
      eventType: 'customer.subscription.created',
      object: subscriptionEvent,
    });

    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.row.plan).toBe('complete');
    expect(built.row.status).toBe('active');
    expect(built.row.billing_interval).toBe('year');
    expect(built.row.stripe_subscription_id).toBe('sub_123');
    expect(built.row.stripe_customer_id).toBe('cus_123');
    expect(built.row.current_period_end).toBe(new Date(1_762_678_400 * 1000).toISOString());
  });

  it('8. deux fois le même événement produisent la même ligne — pas de doublon', () => {
    // L'idempotence tient à deux choses : une clé stable, et un contenu
    // déterministe. La contrainte d'unicité sur `stripe_subscription_id`
    // (migration 015) fait le reste côté base, via `upsert`.
    const first = buildSubscriptionRow({
      eventType: 'customer.subscription.updated',
      object: subscriptionEvent,
    });
    const second = buildSubscriptionRow({
      eventType: 'customer.subscription.updated',
      object: subscriptionEvent,
    });

    expect(first).toEqual(second);
    if (!first.ok) return;
    expect(first.row.stripe_subscription_id).toBe('sub_123');
  });

  it('refuse un plan illisible plutôt que d’en choisir un', () => {
    const built = buildSubscriptionRow({
      eventType: 'customer.subscription.created',
      object: { ...subscriptionEvent, metadata: {} },
    });
    expect(built.ok).toBe(false);
    if (built.ok) return;
    expect(built.reason).toBe('unknown-plan');
  });

  it('retombe sur l’identifiant de prix quand la métadonnée manque', () => {
    const built = buildSubscriptionRow({
      eventType: 'customer.subscription.created',
      object: { ...subscriptionEvent, metadata: {} },
      planByPriceId: { price_abc: 'system' },
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.row.plan).toBe('system');
  });

  it('distingue l’identifiant d’abonnement de celui de la session', () => {
    // Les confondre créerait deux lignes pour un même abonnement.
    expect(
      subscriptionIdFromEvent('checkout.session.completed', {
        id: 'cs_test_1',
        subscription: 'sub_999',
      }),
    ).toBe('sub_999');

    expect(subscriptionIdFromEvent('customer.subscription.updated', { id: 'sub_999' })).toBe(
      'sub_999',
    );
  });

  it('refuse un événement sans identifiant d’abonnement', () => {
    const built = buildSubscriptionRow({
      eventType: 'checkout.session.completed',
      object: { id: 'cs_test_1', metadata: { plan: 'agent' } },
    });
    expect(built.ok).toBe(false);
    if (built.ok) return;
    expect(built.reason).toBe('missing-subscription-id');
  });

  it('construit la correspondance prix → plan depuis l’environnement', () => {
    const map = planByPriceIdFromEnv({
      STRIPE_PRICE_AGENT_MONTHLY: 'price_a',
      STRIPE_PRICE_SYSTEME_ANNUAL: 'price_s',
      STRIPE_PRICE_COMPLET_MONTHLY: 'price_c',
      STRIPE_PRICE_AGENT_ANNUAL: undefined,
    });
    expect(map).toEqual({ price_a: 'agent', price_s: 'system', price_c: 'complete' });
  });
});
