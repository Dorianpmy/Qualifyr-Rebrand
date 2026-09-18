import { NextResponse } from 'next/server';
import { deleteBooking, getDetailerForOwner } from '@/lib/detailing/dashboard';
import { isGuardFailure, requireCapability } from '@/lib/billing/guard';

/**
 * Suppression définitive d'une demande depuis le tableau de bord.
 * Voir `deleteBooking` (`dashboard.ts`) pour le pourquoi : `Annuler` change
 * le statut mais laisse la ligne, ce qui a fini par accumuler des
 * réservations tests dans « Demandes » sans moyen de les faire disparaître.
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireCapability('dashboard');
  if (isGuardFailure(guard)) return guard.response;
  const { user } = guard;

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) {
    return NextResponse.json({ ok: false, message: 'Aucun compte detailer lié.' }, { status: 403 });
  }

  const { id } = await context.params;
  const result = await deleteBooking(detailer.id, id);
  if (!result.ok) {
    return NextResponse.json(result, { status: result.message === 'Demande introuvable.' ? 404 : 400 });
  }

  return NextResponse.json({ ok: true });
}
