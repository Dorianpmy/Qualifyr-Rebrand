import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isGuardFailure, requireCapability } from '@/lib/billing/guard';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { isValidPaypalLink } from '@/lib/detailing/paypal-link';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';

/**
 * Choix du mode d'encaissement de l'acompte : Stripe ou manuel.
 *
 * Référence : docs/18-options-paiement-acompte.md. Distinct de
 * `/api/app/stripe-connect`, qui reste le seul point d'entrée pour
 * l'onboarding Stripe lui-même — cette route ne fait que basculer entre les
 * modes et enregistrer les coordonnées du mode manuel (virement ou lien
 * PayPal).
 *
 * **Le lien PayPal est validé côté serveur, jamais fait confiance côté
 * client.** Un lien qui ne pointe pas vers `paypal.com`/`paypal.me` est
 * refusé avant d'atteindre la base — c'est ce même lien qui sera montré comme
 * cliquable à un client final sur l'écran de confirmation.
 */

export const dynamic = 'force-dynamic';

const settingsSchema = z.object({
  paymentMode: z.enum(['stripe', 'manuel']),
  manualMethod: z.enum(['virement', 'paypal_lien']).nullable().optional(),
  paypalLink: z.string().trim().max(300).optional(),
  iban: z.string().trim().max(50).optional(),
});

export async function GET() {
  const guard = await requireCapability('payments.deposit', { write: false });
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

  const { data } = await supabase
    .from('detailers')
    .select('payment_mode, manual_method, paypal_link, iban')
    .eq('id', detailer.id)
    .single();

  return NextResponse.json({
    paymentMode: (data?.payment_mode as string | null) ?? 'stripe',
    manualMethod: (data?.manual_method as string | null) ?? null,
    paypalLink: (data?.paypal_link as string | null) ?? null,
    iban: (data?.iban as string | null) ?? null,
  });
}

export async function PUT(request: Request) {
  const guard = await requireCapability('payments.deposit');
  if (isGuardFailure(guard)) return guard.response;
  const { user } = guard;

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) {
    return NextResponse.json({ error: 'Compte non rattaché.' }, { status: 403 });
  }

  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const { paymentMode, manualMethod, paypalLink, iban } = parsed.data;

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Base indisponible.' }, { status: 503 });
  }

  const updates: Record<string, unknown> = { payment_mode: paymentMode };

  if (paymentMode === 'manuel') {
    if (manualMethod !== 'virement' && manualMethod !== 'paypal_lien') {
      return NextResponse.json(
        { error: 'Choisissez un moyen : virement bancaire ou lien PayPal.' },
        { status: 400 },
      );
    }

    if (manualMethod === 'paypal_lien') {
      if (!paypalLink || !isValidPaypalLink(paypalLink)) {
        return NextResponse.json(
          { error: 'Ce lien ne pointe pas vers PayPal (paypal.com ou paypal.me).' },
          { status: 400 },
        );
      }
      updates.paypal_link = paypalLink;
    } else {
      // Un IBAN peut déjà exister (saisi pour la QR-facture, migration 012) ;
      // on ne l'exige ici que s'il n'y en a encore aucun.
      const { data: existing } = await supabase
        .from('detailers')
        .select('iban')
        .eq('id', detailer.id)
        .single();

      const effectiveIban = iban || (existing?.iban as string | null);
      if (!effectiveIban) {
        return NextResponse.json(
          { error: 'Indiquez votre IBAN pour recevoir les virements.' },
          { status: 400 },
        );
      }
      if (iban) updates.iban = iban;
      updates.paypal_link = null;
    }

    updates.manual_method = manualMethod;
  }

  const { error } = await supabase.from('detailers').update(updates).eq('id', detailer.id);

  if (error) {
    return NextResponse.json({ error: 'Enregistrement impossible.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
