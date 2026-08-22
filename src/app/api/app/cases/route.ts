import { NextResponse } from 'next/server';
import { isGuardFailure, requireCapability } from '@/lib/billing/guard';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { createCase } from '@/lib/detailing/cases';

export async function POST(request: Request) {
  /* Contrôle d'accès serveur : authentification **et** droit lié à
     l'abonnement. C'est le seul contrôle qui protège — masquer le
     module dans l'interface n'empêche pas d'appeler cette URL. */
  const guard = await requireCapability('gallery');
  if (isGuardFailure(guard)) return guard.response;
  const { user } = guard;

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) {
    return NextResponse.json({ ok: false, message: 'Detailer non lié.' }, { status: 403 });
  }

  let body: {
    title?: string;
    vehicleLabel?: string;
    serviceLabel?: string;
    beforeUrl?: string;
    afterUrl?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'JSON invalide.' }, { status: 400 });
  }

  if (!body.title?.trim() || !body.beforeUrl?.trim() || !body.afterUrl?.trim()) {
    return NextResponse.json(
      { ok: false, message: 'Titre + URL avant + URL après requis.' },
      { status: 400 },
    );
  }

  const payload: {
    detailerId: string;
    title: string;
    beforeUrl: string;
    afterUrl: string;
    vehicleLabel?: string;
    serviceLabel?: string;
  } = {
    detailerId: detailer.id,
    title: body.title.trim(),
    beforeUrl: body.beforeUrl.trim(),
    afterUrl: body.afterUrl.trim(),
  };
  if (body.vehicleLabel?.trim()) payload.vehicleLabel = body.vehicleLabel.trim();
  if (body.serviceLabel?.trim()) payload.serviceLabel = body.serviceLabel.trim();

  const created = await createCase(payload);

  if (!created) {
    return NextResponse.json({ ok: false, message: 'Création impossible.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: created.id });
}
