import { NextResponse } from 'next/server';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { saveCatalogue, type CataloguePatch } from '@/lib/detailing/pricing-admin';
import { getSessionUser } from '@/lib/detailing/session';

/**
 * Enregistrement du catalogue d'un professionnel.
 *
 * Le `detailerId` n'est jamais lu depuis le corps de la requête : il est
 * résolu depuis la session. Sans cela, n'importe quel professionnel connecté
 * pourrait réécrire les tarifs d'un concurrent en changeant un identifiant.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Non connecté.' }, { status: 401 });
  }

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) {
    return NextResponse.json({ ok: false, message: 'Compte non lié.' }, { status: 403 });
  }

  let patch: CataloguePatch;
  try {
    patch = (await request.json()) as CataloguePatch;
  } catch {
    return NextResponse.json({ ok: false, message: 'Requête illisible.' }, { status: 400 });
  }

  // Un pays hors périmètre produirait une facture non conforme, silencieusement.
  if (patch.settings?.country && !['FR', 'CH'].includes(patch.settings.country)) {
    return NextResponse.json({ ok: false, message: 'Pays non pris en charge.' }, { status: 400 });
  }

  const result = await saveCatalogue(detailer.id, patch);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
