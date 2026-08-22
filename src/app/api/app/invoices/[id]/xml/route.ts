import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isGuardFailure, requireCapability } from '@/lib/billing/guard';
import { buildCiiInvoiceXml } from '@/lib/detailing/einvoice';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { detailingServiceEnv } from '@/lib/detailing/env';
import { getInvoiceWithLines } from '@/lib/detailing/invoices';

/**
 * Téléchargement du XML structuré (CII, EN 16931) d'une facture.
 *
 * Le fichier humainement lisible existe déjà (`/app/invoices/[id]/print`) ;
 * celui-ci est la même facture au format machine — voir les explications
 * dans `src/lib/detailing/einvoice.ts`.
 */

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  /* Contrôle d'accès serveur : authentification **et** droit lié à
     l'abonnement. C'est le seul contrôle qui protège — masquer le
     module dans l'interface n'empêche pas d'appeler cette URL. */
  const guard = await requireCapability('invoices');
  if (isGuardFailure(guard)) return guard.response;
  const { user } = guard;

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) {
    return NextResponse.json({ error: 'Compte non lié à une fiche detailer.' }, { status: 403 });
  }

  const { id } = await params;
  const packed = await getInvoiceWithLines(id, detailer.id);
  if (!packed) {
    return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 });
  }

  const env = detailingServiceEnv();
  let legal: Record<string, string | null> = {};
  if (env) {
    const client = createClient(env.url, env.serviceRoleKey, {
      auth: { persistSession: false },
    });
    const { data } = await client
      .from('detailers')
      .select('legal_name, siret, siren, tva_intra, legal_address, legal_city, legal_postal, country')
      .eq('id', detailer.id)
      .maybeSingle();
    if (data) legal = data as Record<string, string | null>;
  }

  // Le CII (EN 16931) est un format français/européen — un detailer suisse
  // n'en a pas l'usage, sa facture porte une QR-facture à la place (voir
  // `/app/invoices/[id]/print`). Accessible en direct malgré le bouton
  // masqué côté page : défense en profondeur, pas seulement du CSS.
  if (legal.country === 'CH') {
    return NextResponse.json(
      { error: 'Le format CII ne s’applique pas en Suisse. Voir la QR-facture sur le PDF.' },
      { status: 422 },
    );
  }

  const xml = buildCiiInvoiceXml({
    invoice: packed.invoice,
    lines: packed.lines,
    seller: {
      name: (legal.legal_name as string) || detailer.name,
      siren: (legal.siren as string | null) ?? null,
      siret: (legal.siret as string | null) ?? null,
      tvaIntra: (legal.tva_intra as string | null) ?? null,
      address: (legal.legal_address as string | null) ?? null,
      postalCode: (legal.legal_postal as string | null) ?? null,
      city: (legal.legal_city as string | null) ?? null,
      country: (legal.country as string | null) ?? 'FR',
    },
  });

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${packed.invoice.number}.xml"`,
    },
  });
}
