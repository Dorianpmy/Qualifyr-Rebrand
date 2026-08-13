import { slotsForDay } from '@/lib/detailing/slots';

/**
 * Créneaux disponibles pour un jour donné, une fois la durée connue.
 * `minutes` vient du devis déjà calculé côté client (§2.6) : le serveur ne
 * refait pas ce calcul ici, il ne fait que placer la durée dans l'agenda.
 */
export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const dayParam = url.searchParams.get('day');
  const minutes = Number(url.searchParams.get('minutes'));

  if (!dayParam || !/^\d{4}-\d{2}-\d{2}$/.test(dayParam) || !Number.isFinite(minutes) || minutes <= 0) {
    return Response.json({ error: 'invalid_params' }, { status: 400 });
  }

  const day = new Date(`${dayParam}T00:00:00`);
  if (Number.isNaN(day.getTime())) {
    return Response.json({ error: 'invalid_params' }, { status: 400 });
  }

  const result = await slotsForDay(slug, day, minutes);
  if (!result.ok) {
    return Response.json(
      { error: result.reason },
      { status: result.reason === 'detailer_not_found' ? 404 : 503 },
    );
  }

  return Response.json({
    slots: result.slots.map((slot) => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
    })),
  });
}
