import { z } from 'zod';
import { createBooking } from '@/lib/detailing/booking';
import type {
  LocationMode,
  OptionKey,
  Scope,
  SoilingLevel,
  VehicleSize,
} from '@/lib/detailing/types';
import { optionKeys, scopes, soilingLevels, vehicleSizes } from '@/lib/detailing/types';

const bodySchema = z.object({
  email: z.string().trim().min(3).max(200).email(),
  phone: z.string().trim().max(40).optional(),
  vehicleSize: z.enum(vehicleSizes as [VehicleSize, ...VehicleSize[]]),
  vehicleModel: z.string().trim().max(120).optional(),
  plate: z.string().trim().max(20).optional(),
  scope: z.enum(scopes as [Scope, ...Scope[]]),
  soiling: z.enum(soilingLevels as [SoilingLevel, ...SoilingLevel[]]),
  optionKeys: z
    .array(z.enum(optionKeys as [OptionKey, ...OptionKey[]]))
    .max(optionKeys.length),
  locationMode: z.enum(['domicile', 'atelier'] as [LocationMode, ...LocationMode[]]),
  postalCode: z.string().trim().max(10).optional(),
  travelKm: z.number().min(0).max(500).optional(),
  photos: z.array(z.string().trim().min(1)).min(3, 'Trois photos sont nécessaires.'),
  slotStart: z.string().trim().min(1),
});

/**
 * Dépôt d'une réservation. Le devis envoyé par le client n'est jamais utilisé
 * pour l'enregistrement — `createBooking` le recalcule depuis la
 * configuration du professionnel (§2 de docs/13-saas-nettoyage-automobile.md).
 */
export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'invalid_body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 });
  }

  const result = await createBooking({ slug, ...parsed.data });

  if (!result.ok) {
    const status =
      result.reason === 'detailer_not_found'
        ? 404
        : result.reason === 'slot_taken'
          ? 409
          : result.reason === 'travel_out_of_range' || result.reason === 'photos_required'
            ? 422
            : result.reason === 'not_configured'
              ? 503
              : 400;
    return Response.json({ error: result.reason, message: result.message }, { status });
  }

  return Response.json({ booking: result.booking }, { status: 201 });
}
