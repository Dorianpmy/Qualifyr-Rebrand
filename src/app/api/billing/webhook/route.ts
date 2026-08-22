import { NextResponse } from 'next/server';
import { logServerEvent } from '@/lib/analytics-server';
import {
  buildSubscriptionRow,
  emailFromEvent,
  planByPriceIdFromEnv,
  type StripeSubscriptionLike,
} from '@/lib/billing/provisioning';
import { verifyWebhookSignature } from '@/lib/billing/stripe';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import { resolveTransport } from '@/lib/email/transport';

/**
 * Webhook Stripe — abonnements Qualifyr.
 *
 * Endpoint distinct de `/api/detailing/stripe-webhook` (qui confirme les
 * acomptes clients sur les comptes Connect des professionnels) : à déclarer
 * séparément dans le tableau de bord Stripe, avec son propre secret de
 * signature (`STRIPE_BILLING_WEBHOOK_SECRET`), sur les événements
 * `checkout.session.completed`, `customer.subscription.updated`,
 * `customer.subscription.deleted` et, depuis le 22/08/2026,
 * `checkout.session.expired` (à cocher en plus dans le tableau de bord
 * Stripe pour que la relance de panier abandonné fonctionne — voir
 * `lib/billing/stripe.ts`).
 *
 * **Ce que cette route fait.** Elle vérifie la signature (sans quoi n'importe
 * qui pourrait simuler un paiement), traduit l'événement en ligne
 * d'abonnement, l'écrit dans `subscriptions`, journalise, et relance par
 * e-mail un paiement abandonné quand le client y a consenti.
 *
 * **Provisioning branché le 22/08/2026.** Jusque-là, cette route journalisait
 * et s'arrêtait : un client pouvait payer sans obtenir le moindre accès. La
 * table `subscriptions` (migration 015) donne l'endroit où écrire ; c'est
 * elle que `lib/billing/entitlements.ts` lit pour décider de tout accès.
 *
 * **Idempotence.** Stripe garantit « au moins une fois », jamais « exactement
 * une fois » : le même événement peut arriver deux fois. Toutes les écritures
 * passent donc par un `upsert` sur `stripe_subscription_id`, qui porte un
 * index unique — rejouer un événement met la ligne à jour au lieu d'en créer
 * une seconde.
 *
 * **Rattachement au compte.** Stripe ne connaît pas les comptes Qualifyr : il
 * faut retrouver l'utilisateur à partir du client Stripe (déjà rattaché lors
 * d'un événement précédent) ou, à défaut, de son e-mail. Si aucun des deux ne
 * donne de résultat, la route **n'accorde aucun droit** et journalise une
 * erreur explicite : accorder un accès au mauvais compte serait pire que de
 * n'en accorder aucun. La réponse reste un `200` — un `500` ferait rejouer
 * Stripe en boucle sur un problème que le rejeu ne résoudra pas.
 */

export const dynamic = 'force-dynamic';

type StripeEvent = {
  readonly type: string;
  readonly data: {
    readonly object: StripeSubscriptionLike & {
      readonly consent?: {
        readonly promotions?: string;
      };
      readonly after_expiration?: {
        readonly recovery?: {
          readonly url?: string;
        };
      };
    };
  };
};

/**
 * Retrouve le compte Qualifyr auquel rattacher un abonnement.
 *
 * Deux pistes, dans cet ordre :
 *
 * 1. **L'identifiant client Stripe**, s'il figure déjà sur une ligne
 *    d'abonnement. C'est le cas dès le deuxième événement d'un même client, et
 *    c'est la piste la plus fiable — elle ne dépend d'aucune saisie.
 * 2. **L'e-mail**, sinon. C'est la seule piste au tout premier événement.
 *    Comparaison en minuscules : Stripe renvoie l'adresse telle que saisie,
 *    Supabase la stocke normalisée, et « Jean@… » ne doit pas manquer
 *    « jean@… ».
 *
 * Renvoie `null` si aucune ne donne de résultat. L'appelant doit alors refuser
 * d'écrire : mieux vaut un abonnement non provisionné, visible dans les
 * journaux, qu'un accès accordé au mauvais compte.
 */
async function findOwnerId(input: {
  readonly client: ReturnType<typeof getServiceSupabaseClient>;
  readonly stripeCustomerId: string | null;
  readonly email: string | null;
}): Promise<string | null> {
  const { client, stripeCustomerId, email } = input;
  if (!client) return null;

  if (stripeCustomerId) {
    const { data } = await client
      .from('subscriptions')
      .select('owner_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .limit(1)
      .maybeSingle();
    if (data?.owner_id) return String(data.owner_id);
  }

  if (email) {
    // `listUsers` plutôt qu'une requête sur `auth.users` : cette table n'est
    // pas exposée à PostgREST, l'API d'administration est le seul accès.
    const { data } = await client.auth.admin.listUsers({ page: 1, perPage: 200 });
    const match = data?.users?.find(
      (candidate) => (candidate.email ?? '').trim().toLowerCase() === email,
    );
    if (match?.id) return match.id;
  }

  return null;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_BILLING_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[billing/webhook] STRIPE_BILLING_WEBHOOK_SECRET manquante');
    return NextResponse.json({ error: 'Non configuré.' }, { status: 503 });
  }

  // Corps lu en texte brut : la signature porte sur les octets exacts envoyés
  // par Stripe, pas sur une re-sérialisation JSON.
  const payload = await request.text();

  const valid = await verifyWebhookSignature({
    payload,
    header: request.headers.get('stripe-signature'),
    secret,
  });

  if (!valid) {
    // 400 et non 401 : Stripe réessaie sur 5xx, jamais sur 4xx. Une signature
    // invalide ne deviendra pas valide en réessayant.
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;

  const handled = [
    'checkout.session.completed',
    // Ajouté le 22/08/2026 : un abonnement créé directement dans le tableau
    // de bord Stripe, ou par un essai, n'émet aucun `checkout.session.*`.
    // Sans cet événement, ces comptes n'auraient jamais eu de droits.
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'checkout.session.expired',
    // Échec de paiement : Stripe passe l'abonnement en `past_due` et émet
    // aussi un `customer.subscription.updated`, mais celui-ci arrive avec le
    // statut à jour. On journalise l'échec pour pouvoir le suivre.
    'invoice.payment_failed',
  ];

  if (!handled.includes(event.type)) {
    // Accepté sans traitement : renvoyer une erreur ferait réessayer Stripe
    // en boucle sur des événements qu'on a simplement choisi d'ignorer.
    return NextResponse.json({ received: true });
  }

  const object = event.data.object;
  const plan = object.metadata?.plan ?? 'inconnu';
  const cadence = object.metadata?.cadence ?? 'inconnue';

  if (event.type === 'checkout.session.expired') {
    // Relance de paiement abandonné (§3 de l'audit growth marketing).
    //
    // **Consentement d'abord.** Sans `consent.promotions === 'opt_in'`,
    // Stripe ne renvoie même pas l'e-mail du client dans cet événement — il
    // n'y a alors rien à faire, et c'est volontaire (RGPD, voir
    // `lib/billing/stripe.ts`).
    //
    // **Pas de déduplication en base.** Une session Stripe n'expire qu'une
    // fois : ce webhook ne devrait donc recevoir cet événement qu'une seule
    // fois par session, sauf rejeu réseau de Stripe lui-même (rare, et sans
    // conséquence grave si un même client reçoit deux fois le même lien).
    // Construire un magasin de déduplication pour ce seul cas n'a pas semblé
    // justifié tant qu'aucune table `subscriptions` n'existe déjà (voir
    // PROVISIONING plus bas) — à revoir si un abus est constaté.
    const email = object.customer_details?.email;
    const recoveryUrl = object.after_expiration?.recovery?.url;
    const consented = object.consent?.promotions === 'opt_in';

    if (email && recoveryUrl && consented) {
      const resolution = resolveTransport();
      if (resolution.status === 'ready') {
        const sent = await resolution.transport.send({
          to: email,
          from: resolution.from,
          subject: 'Vous n’avez pas terminé votre abonnement Qualifyr',
          text: [
            'Vous avez commencé à vous abonner à Qualifyr et le paiement ne s’est pas terminé.',
            '',
            `Reprendre où vous en étiez : ${recoveryUrl}`,
            '',
            'Ce lien reste valable 30 jours. Si vous avez changé d’avis, vous pouvez ignorer ce message.',
          ].join('\n'),
        });
        void logServerEvent({
          eventName: sent.ok ? 'checkout_recovery_email_sent' : 'checkout_recovery_email_failed',
          metadata: { plan, cadence },
        });
      }
    }

    return NextResponse.json({ received: true });
  }

  // `console.warn`, pas `console.info` : la règle de lint du projet n'autorise
  // que `warn`/`error` sur la console. Ni l'identifiant client ni l'e-mail ne
  // sont journalisés — un journal d'hébergeur n'est pas l'endroit où faire
  // vivre une donnée personnelle.
  console.warn(
    `[billing/webhook] ${event.type} — plan=${plan} cadence=${cadence} status=${object.status ?? 'n/a'}`,
  );

  void logServerEvent({
    eventName:
      event.type === 'checkout.session.completed' ? 'payment_completed' : 'subscription_updated',
    metadata: { plan, cadence, status: object.status ?? null },
  });

  // --- Provisioning --------------------------------------------------------

  // `invoice.payment_failed` n'apporte pas de plan : le changement de statut
  // arrive par le `customer.subscription.updated` que Stripe émet en même
  // temps. On se contente donc de le tracer.
  if (event.type === 'invoice.payment_failed') {
    void logServerEvent({ eventName: 'payment_failed', metadata: { plan, cadence } });
    return NextResponse.json({ received: true });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    // 503 : contrairement aux autres erreurs, celle-ci se résout d'elle-même
    // quand la base revient — et Stripe réessaie sur 5xx.
    console.error('[billing/webhook] base indisponible, provisioning différé');
    return NextResponse.json({ error: 'Base indisponible.' }, { status: 503 });
  }

  const built = buildSubscriptionRow({
    eventType: event.type,
    object,
    planByPriceId: planByPriceIdFromEnv(process.env),
  });

  if (!built.ok) {
    // Aucun droit accordé : un plan qu'on ne sait pas lire ne doit jamais
    // devenir un plan par défaut.
    console.error(
      `[billing/webhook] provisioning refusé (${built.reason}) sur ${event.type}`,
    );
    void logServerEvent({
      eventName: 'provisioning_failed',
      metadata: { reason: built.reason, eventType: event.type },
    });
    return NextResponse.json({ received: true, provisioned: false });
  }

  const ownerId = await findOwnerId({
    client: supabase,
    stripeCustomerId: built.row.stripe_customer_id,
    email: emailFromEvent(object),
  });

  if (!ownerId) {
    console.error(
      `[billing/webhook] compte introuvable pour ${event.type} — abonnement non provisionné`,
    );
    void logServerEvent({
      eventName: 'provisioning_failed',
      metadata: { reason: 'owner-not-found', eventType: event.type },
    });
    return NextResponse.json({ received: true, provisioned: false });
  }

  /*
   * Résiliation : on met le statut à jour, on ne supprime rien.
   *
   * L'historique d'un abonnement résilié doit rester consultable — c'est ce
   * qui permet à un ancien client de récupérer ses factures. `canAccess`
   * traite `canceled` comme un accès en lecture seule.
   */
  const row =
    event.type === 'customer.subscription.deleted'
      ? { ...built.row, status: 'canceled' as const }
      : built.row;

  /*
   * Clôture de l'abonnement vivant précédent, s'il en existe un autre.
   *
   * **Sans cette étape, un changement d'offre laissait le client sans
   * droits après paiement** (constaté à l'audit de vérification du
   * 22/08/2026). La migration 015 n'autorise qu'un seul abonnement vivant
   * par propriétaire ; or une montée en gamme crée un **nouvel** abonnement
   * Stripe, avec un nouvel identifiant. L'écriture de ce nouvel abonnement
   * entrait donc en conflit avec l'ancien, encore `active` — la route
   * renvoyait 500, Stripe rejouait en boucle, et le client avait payé pour
   * rien.
   *
   * Même problème quand les événements arrivent dans le désordre : Stripe ne
   * garantit aucun ordre, et le `created` du nouvel abonnement peut précéder
   * le `deleted` de l'ancien.
   *
   * `canceled` plutôt qu'une suppression : l'historique reste consultable,
   * comme partout ailleurs dans ce système.
   */
  if (row.status === 'trialing' || row.status === 'active' || row.status === 'past_due') {
    const { error: closeError } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('owner_id', ownerId)
      .neq('stripe_subscription_id', row.stripe_subscription_id)
      .in('status', ['trialing', 'active', 'past_due']);

    if (closeError) {
      console.error('[billing/webhook] clôture du précédent impossible', closeError.message);
      return NextResponse.json({ error: 'Écriture impossible.' }, { status: 500 });
    }
  }

  /*
   * `upsert` sur `stripe_subscription_id`, jamais `insert`.
   *
   * C'est ce qui rend la route idempotente : le même événement rejoué par
   * Stripe met la ligne à jour au lieu d'en créer une seconde. L'index unique
   * **total** de la migration 015 est ce qui donne son sens à `onConflict` —
   * un index partiel n'aurait pas été inféré par PostgREST, et chaque
   * écriture aurait échoué (voir le commentaire de la migration).
   */
  const { error: upsertError } = await supabase
    .from('subscriptions')
    .upsert({ ...row, owner_id: ownerId }, { onConflict: 'stripe_subscription_id' });

  if (upsertError) {
    console.error('[billing/webhook] écriture impossible', upsertError.message);
    // 500 : Stripe réessaiera, et une écriture qui échoue pour une raison
    // transitoire doit pouvoir aboutir au essai suivant.
    return NextResponse.json({ error: 'Écriture impossible.' }, { status: 500 });
  }

  void logServerEvent({
    eventName: 'subscription_provisioned',
    metadata: { plan: row.plan, status: row.status },
  });

  return NextResponse.json({ received: true, provisioned: true });
}
