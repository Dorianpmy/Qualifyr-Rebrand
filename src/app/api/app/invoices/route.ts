import { NextResponse } from 'next/server';
import { isGuardFailure, requireCapability } from '@/lib/billing/guard';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { createInvoice, type CreateInvoiceInput } from '@/lib/detailing/invoices';

export async function POST(request: Request) {
  /* Contrôle d'accès serveur : authentification **et** droit lié à
     l'abonnement. C'est le seul contrôle qui protège — masquer le
     module dans l'interface n'empêche pas d'appeler cette URL. */
  const guard = await requireCapability('invoices');
  if (isGuardFailure(guard)) return guard.response;
  const { user } = guard;

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

  const input: CreateInvoiceInput = {
    detailerId: detailer.id,
    clientName: body.clientName.trim(),
    description: body.description.trim(),
    unitPriceHt: Number(body.unitPriceHt),
    quantity: body.quantity ? Number(body.quantity) : 1,
    tvaRate: body.tvaRate != null ? Number(body.tvaRate) : 20,
    tvaFranchise: Boolean(body.tvaFranchise),
    issue: body.issue !== false,
  };
  if (body.bookingId) input.bookingId = body.bookingId;
  if (body.clientEmail) input.clientEmail = body.clientEmail;
  if (body.clientSiren) input.clientSiren = body.clientSiren;

  const created = await createInvoice(input);

  if (!created) {
    return NextResponse.json({ ok: false, message: 'Création impossible.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: created.id, number: created.number });
}
