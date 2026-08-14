import { NextResponse } from 'next/server';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { createCase } from '@/lib/detailing/cases';
import { getSessionUser } from '@/lib/detailing/session';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Non connecté.' }, { status: 401 });
  }

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

  const created = await createCase({
    detailerId: detailer.id,
    title: body.title.trim(),
    vehicleLabel: body.vehicleLabel,
    serviceLabel: body.serviceLabel,
    beforeUrl: body.beforeUrl.trim(),
    afterUrl: body.afterUrl.trim(),
  });

  if (!created) {
    return NextResponse.json({ ok: false, message: 'Création impossible.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: created.id });
}
