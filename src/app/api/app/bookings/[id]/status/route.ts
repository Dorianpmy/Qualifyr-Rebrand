import { NextResponse } from 'next/server';
import {
  getDetailerForOwner,
  updateBookingStatus,
} from '@/lib/detailing/dashboard';
import { getSessionUser } from '@/lib/detailing/session';
import type { BookingStatus } from '@/lib/detailing/types';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Non authentifié.' }, { status: 401 });
  }

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
