import { NextResponse } from 'next/server';
import { isGuardFailure, requireCapability } from '@/lib/billing/guard';
import { confirmDepositManually, getDetailerForOwner } from '@/lib/detailing/dashboard';

/**
 * « Acompte reçu » — confirmation manuelle, mode virement ou lien PayPal.
 *
 * Référence : docs/18-options-paiement-acompte.md §4. Distinct du bouton
 * générique « Confirmer » de `StatusActions` (`/api/app/bookings/[id]/status`)
 * qui existait déjà avant ce mode : celui-ci est réservé aux réservations en
 * attente de paiement et pose en plus `deposit_confirmed_by`/
 * `deposit_confirmed_by_user_id`, la trace qui distingue une confirmation
 * automatique (webhook Stripe) d'une affirmation du professionnel.
 */

export const dynamic = 'force-dynamic';

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireCapability('payments.deposit');
  if (isGuardFailure(guard)) return guard.response;
  const { user } = guard;

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) {
    return NextResponse.json({ ok: false, message: 'Aucun compte detailer lié.' }, { status: 403 });
  }

  const { id } = await context.params;
  const result = await confirmDepositManually(detailer.id, id, user.id);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
