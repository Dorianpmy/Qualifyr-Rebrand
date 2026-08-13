import { NextResponse } from 'next/server';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { createInvoice } from '@/lib/detailing/invoices';
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
    clientName?: string;
    clientEmail?: string;
    clientSiren?: string;
    description?: string;
    unitPriceHt?: number;
    quantity?: number;
    tvaRate?: number;
    tvaFranchise?: boolean;
    issue?: boolean;
    bookingId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'JSON invalide.' }, { status: 400 });
  }

  if (!body.clientName?.trim() || !body.description?.trim() || body.unitPriceHt == null) {
    return NextResponse.json(
      { ok: false, message: 'Client, description et prix HT requis.' },
      { status: 400 },
    );
  }

  const created = await createInvoice({
    detailerId: detailer.id,
    bookingId: body.bookingId,
    clientName: body.clientName.trim(),
    clientEmail: body.clientEmail,
    clientSiren: body.clientSiren,
    description: body.description.trim(),
    unitPriceHt: Number(body.unitPriceHt),
    quantity: body.quantity ? Number(body.quantity) : 1,
    tvaRate: body.tvaRate != null ? Number(body.tvaRate) : 20,
    tvaFranchise: Boolean(body.tvaFranchise),
    issue: body.issue !== false,
  });

  if (!created) {
    return NextResponse.json({ ok: false, message: 'Création impossible.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: created.id, number: created.number });
}
