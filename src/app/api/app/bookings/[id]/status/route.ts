import { NextResponse } from 'next/server';
import {
  getDetailerForOwner,
  updateBookingStatus,
} from '@/lib/detailing/dashboard';
import { isGuardFailure, requireCapability } from '@/lib/billing/guard';
import type { BookingStatus } from '@/lib/detailing/types';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  /* Contrôle d'accès serveur : authentification **et** droit lié à
     l'abonnement. C'est le seul contrôle qui protège — masquer le
     module dans l'interface n'empêche pas d'appeler cette URL. */
  const guard = await requireCapability('dashboard');
  if (isGuardFailure(guard)) return guard.response;
  const { user } = guard;

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) {
    return NextResponse.json({ ok: false, message: 'Aucun compte detailer lié.' }, { status: 403 });
  }

  const { id } = await context.params;
  let body: { status?: string };
  try {
    body = (await request.json()) as { status?: string };
  } catch {
    return NextResponse.json({ ok: false, message: 'Requête invalide.' }, { status: 400 });
  }

  const status = body.status as BookingStatus | undefined;
  if (!status) {
    return NextResponse.json({ ok: false, message: 'Statut manquant.' }, { status: 400 });
  }

  const result = await updateBookingStatus(detailer.id, id, status);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
