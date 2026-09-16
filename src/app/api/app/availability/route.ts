import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isGuardFailure, requireCapability } from '@/lib/billing/guard';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';

/**
 * Horaires d'ouverture hebdomadaires du professionnel.
 *
 * Référence : docs/19-horaires-ouverture.md. `detailer_availability` existait
 * déjà et était déjà lue par le moteur de créneaux
 * (`src/lib/detailing/availability.ts`) — mais aucun écran ne permettait de la
 * renseigner, la seule voie étant une requête SQL manuelle. Cette route est la
 * première à y écrire.
 *
 * **L'absence de ligne pour un jour signifie « fermé ».** `availableSlots`
 * (`availability.ts:47-48`) traite un `weekday` sans ligne correspondante
 * comme un jour sans créneau — cette route reflète exactement cette
 * convention : fermer un jour supprime sa ligne plutôt que de la désactiver
 * par un booléen.
 */

export const dynamic = 'force-dynamic';

const HHMM = /^\d{2}:\d{2}$/;

const daySchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    open: z.boolean(),
    opensAt: z.string().regex(HHMM).optional(),
    closesAt: z.string().regex(HHMM).optional(),
  })
  .refine((day) => !day.open || (day.opensAt && day.closesAt && day.opensAt < day.closesAt), {
    message: 'Un jour ouvert doit avoir une heure de fin après l’heure de début.',
  });

const bodySchema = z.object({
  bufferMinutes: z.number().int().min(0).max(240),
  days: z.array(daySchema).length(7),
});

export async function GET() {
  const guard = await requireCapability('planning', { write: false });
  if (isGuardFailure(guard)) return guard.response;
  const { user } = guard;

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) {
    return NextResponse.json({ error: 'Compte non rattaché.' }, { status: 403 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Base indisponible.' }, { status: 503 });
  }

  const { data } = await supabase
    .from('detailer_availability')
    .select('weekday, opens_at, closes_at, buffer_minutes')
    .eq('detailer_id', detailer.id);

  const rows = data ?? [];
  const days = Array.from({ length: 7 }, (_, weekday) => {
    const row = rows.find((r) => Number(r.weekday) === weekday);
    return {
      weekday,
      open: Boolean(row),
      opensAt: row ? String(row.opens_at).slice(0, 5) : null,
      closesAt: row ? String(row.closes_at).slice(0, 5) : null,
    };
  });

  // Toutes les lignes partagent le même battement depuis cet écran (docs/19
  // §0.2) : celui de la première ligne trouvée suffit, à défaut 15 min.
  const bufferMinutes = rows.length > 0 ? Number(rows[0]?.buffer_minutes ?? 15) : 15;

  return NextResponse.json({ days, bufferMinutes });
}

export async function PUT(request: Request) {
  const guard = await requireCapability('planning');
  if (isGuardFailure(guard)) return guard.response;
  const { user } = guard;

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) {
    return NextResponse.json({ error: 'Compte non rattaché.' }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const { bufferMinutes, days } = parsed.data;

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Base indisponible.' }, { status: 503 });
  }

  const openDays = days.filter((day) => day.open);
  const closedWeekdays = days.filter((day) => !day.open).map((day) => day.weekday);

  if (openDays.length > 0) {
    const { error } = await supabase.from('detailer_availability').upsert(
      openDays.map((day) => ({
        detailer_id: detailer.id,
        weekday: day.weekday,
        opens_at: day.opensAt,
        closes_at: day.closesAt,
        buffer_minutes: bufferMinutes,
      })),
      { onConflict: 'detailer_id,weekday' },
    );
    if (error) {
      return NextResponse.json({ error: 'Enregistrement impossible.' }, { status: 500 });
    }
  }

  if (closedWeekdays.length > 0) {
    const { error } = await supabase
      .from('detailer_availability')
      .delete()
      .eq('detailer_id', detailer.id)
      .in('weekday', closedWeekdays);
    if (error) {
      return NextResponse.json({ error: 'Enregistrement impossible.' }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
