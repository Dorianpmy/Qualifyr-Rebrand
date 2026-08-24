import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireCapability } from '@/lib/billing/guard';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import {
  deleteAllImportedProspects,
  deleteImportedProspect,
  importProspects,
  listImportedProspects,
  MAX_IMPORT_SIZE,
} from '@/lib/agent/import-prospects';

/**
 * Listes de prospects importées — consultation, import, suppression.
 *
 * **Même garde que `hermes/route.ts`, pour la même raison.** Importer une
 * liste, c'est fournir de nouveaux destinataires à un envoi qui part au nom
 * du professionnel : `agent.prospecting` en écriture pour `POST` et
 * `DELETE`, en lecture seule pour `GET` — un abonnement résilié peut voir ce
 * qui a été importé, pas en ajouter.
 *
 * **`attestationAccepted` n'est qu'un booléen ; le texte réellement stocké
 * vient du serveur (`IMPORT_ATTESTATION_TEXT`), jamais du client.** Même
 * raisonnement que `terms_accepted_at` : une valeur envoyée par le
 * navigateur pourrait ne pas correspondre à ce qui est réellement affiché à
 * l'écran, et c'est précisément la trace qui établit qui est responsable de
 * quoi en cas de réclamation.
 *
 * **`DELETE` ne touche jamais `agent_import_attestations`.** Voir
 * `import-prospects.ts` : l'attestation est la preuve d'un engagement, elle
 * doit survivre à la suppression des adresses qu'elle couvrait.
 */

const importSchema = z.object({
  text: z.string().trim().min(1, 'La liste est vide.'),
  /* Acceptation explicite, à chaque import — une liste importée six mois
     plus tôt n'a pas la même provenance. */
  attestationAccepted: z.literal(true, {
    message: 'Vous devez certifier l’origine de cette liste.',
  }),
});

const deleteSchema = z.union([
  z.object({ id: z.string().uuid() }),
  z.object({ all: z.literal(true) }),
]);

export async function GET() {
  const guard = await requireCapability('agent.prospecting', { write: false });
  if ('response' in guard) return guard.response;

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'base indisponible' }, { status: 503 });
  }

  const prospects = await listImportedProspects(supabase, guard.user.id);
  return NextResponse.json({ prospects });
}

export async function POST(request: Request) {
  const guard = await requireCapability('agent.prospecting');
  if ('response' in guard) return guard.response;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'corps illisible' }, { status: 400 });
  }

  const parsed = importSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: 'validation', message: first?.message ?? `Une ligne par entreprise, au format « nom, e-mail », ${MAX_IMPORT_SIZE} au maximum.` },
      { status: 422 },
    );
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'base indisponible' }, { status: 503 });
  }

  const outcome = await importProspects(supabase, guard.user.id, parsed.data.text);

  if (!outcome.ok) {
    return NextResponse.json({ error: 'import', message: outcome.reason }, { status: 422 });
  }

  return NextResponse.json({ ok: true, imported: outcome.imported, rejected: outcome.rejected });
}

export async function DELETE(request: Request) {
  const guard = await requireCapability('agent.prospecting');
  if ('response' in guard) return guard.response;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'corps illisible' }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation' }, { status: 422 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'base indisponible' }, { status: 503 });
  }

  if ('all' in parsed.data) {
    const ok = await deleteAllImportedProspects(supabase, guard.user.id);
    if (!ok) return NextResponse.json({ error: 'suppression impossible' }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const ok = await deleteImportedProspect(supabase, guard.user.id, parsed.data.id);
  if (!ok) return NextResponse.json({ error: 'introuvable' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
