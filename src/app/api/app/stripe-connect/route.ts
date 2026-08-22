import { NextResponse } from 'next/server';
import { isGuardFailure, requireCapability } from '@/lib/billing/guard';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import {
  createConnectedAccount,
  createOnboardingLink,
  retrieveAccount,
} from '@/lib/detailing/stripe';

/**
 * Connexion du compte de paiement du professionnel.
 *
 * Un seul point d'entrée pour trois situations, parce que du point de vue du
 * professionnel il n'y a qu'un bouton : « activer les paiements ». Qu'il
 * s'agisse d'une création, d'une reprise de dossier incomplet ou d'une simple
 * vérification, il clique au même endroit.
 *
 * **Les liens Stripe expirent en quelques minutes.** On en génère un neuf à
 * chaque appel plutôt que de le stocker ; un lien mis en base serait périmé au
 * premier usage réel.
 */

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  /* Contrôle d'accès serveur : authentification **et** droit lié à
     l'abonnement. C'est le seul contrôle qui protège — masquer le
     module dans l'interface n'empêche pas d'appeler cette URL. */
  const guard = await requireCapability('payments.deposit');
  if (isGuardFailure(guard)) return guard.response;
  const { user } = guard;

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) {
    return NextResponse.json({ error: 'Compte non rattaché.' }, { status: 403 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Base indisponible.' }, { status: 503 });
  }

  const { data: row } = await supabase
    .from('detailers')
    .select('stripe_account_id, country, email, name')
    .eq('id', detailer.id)
    .single();

  const origin = new URL(request.url).origin;
  const returnUrl = `${origin}/app/prestations?paiement=ok`;
  const refreshUrl = `${origin}/app/prestations?paiement=reprendre`;

  try {
    let accountId = row?.stripe_account_id as string | null;

    if (!accountId) {
      const account = await createConnectedAccount({
        email: (row?.email as string) ?? user.email,
        country: ((row?.country as string) === 'CH' ? 'CH' : 'FR') as 'FR' | 'CH',
        businessName: (row?.name as string) ?? 'Detailing',
      });

      accountId = account.id;

      /*
       * L'identifiant est enregistré **avant** de renvoyer le lien. Si on
       * attendait le retour du professionnel, un abandon en cours de
       * formulaire laisserait un compte orphelin chez Stripe et en créerait un
       * second au clic suivant.
       */
      await supabase
        .from('detailers')
        .update({ stripe_account_id: accountId })
        .eq('id', detailer.id);
    }

    const link = await createOnboardingLink({ accountId, returnUrl, refreshUrl });
    return NextResponse.json({ url: link.url });
  } catch (cause) {
    console.error('[stripe-connect] échec', cause);
    return NextResponse.json(
      { error: 'La connexion au service de paiement a échoué. Réessayez dans un instant.' },
      { status: 502 },
    );
  }
}

/**
 * Rafraîchit l'état du compte depuis Stripe.
 *
 * **Appelé au retour du formulaire, et pas seulement au webhook.** Un
 * professionnel qui vient de terminer son dossier veut le voir marqué actif
 * immédiatement ; attendre l'événement `account.updated` lui montrerait un
 * écran inchangé et il recommencerait.
 */
export async function GET() {
  /* Contrôle d'accès serveur : authentification **et** droit lié à
     l'abonnement. C'est le seul contrôle qui protège — masquer le
     module dans l'interface n'empêche pas d'appeler cette URL. */
  const guard = await requireCapability('payments.deposit');
  if (isGuardFailure(guard)) return guard.response;
  const { user } = guard;

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) {
    return NextResponse.json({ error: 'Compte non rattaché.' }, { status: 403 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Base indisponible.' }, { status: 503 });
  }

  const { data: row } = await supabase
    .from('detailers')
    .select('stripe_account_id, stripe_charges_enabled')
    .eq('id', detailer.id)
    .single();

  const accountId = row?.stripe_account_id as string | null;
  if (!accountId) {
    return NextResponse.json({ connected: false, chargesEnabled: false });
  }

  try {
    const account = await retrieveAccount(accountId);

    await supabase
      .from('detailers')
      .update({
        stripe_charges_enabled: account.charges_enabled,
        stripe_onboarded_at: account.details_submitted ? new Date().toISOString() : null,
      })
      .eq('id', detailer.id);

    return NextResponse.json({
      connected: true,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (cause) {
    console.error('[stripe-connect] lecture impossible', cause);
    // On renvoie l'état connu plutôt qu'une erreur : le tableau de bord doit
    // rester consultable même si Stripe est indisponible.
    return NextResponse.json({
      connected: true,
      chargesEnabled: Boolean(row?.stripe_charges_enabled),
      stale: true,
    });
  }
}
