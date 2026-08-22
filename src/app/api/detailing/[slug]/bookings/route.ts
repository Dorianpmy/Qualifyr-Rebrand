import { z } from 'zod';
import { detailerHasCapabilityBySlug } from '@/lib/billing/guard';
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
  address: z.string().trim().max(300).optional(),
  // Bornes terrestres : une coordonnée hors de ces plages est une erreur de
  // saisie ou une tentative d'injection, jamais une adresse.
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accessNote: z.string().trim().max(300).optional(),
  /**
   * Photos facultatives.
   *
   * Le tunnel a cessé de les exiger — demander trois photos avant de pouvoir
   * réserver suppose d'être devant son véhicule, de jour, avec du réseau. Le
   * schéma imposait encore un minimum de trois : le serveur aurait rejeté
   * chaque réservation que le formulaire acceptait d'envoyer.
   */
  photos: z.array(z.string().trim().min(1)).max(3),
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

  /*
   * La page de réservation publique fait partie des offres « Système seul » et
   * « Pack complet », pas de l'offre « Agent seul ».
   *
   * **Ce contrôle manquait** (constaté à l'audit de vérification du
   * 22/08/2026) : la capacité `booking.public` figurait dans la matrice et
   * dans le tableau de tarifs, mais aucune route ne la vérifiait. Un abonné
   * « Agent seul » gardait donc une page de réservation entièrement
   * fonctionnelle — seul l'encaissement de l'acompte était bloqué, plus loin
   * dans le parcours. C'est exactement le contournement que la consigne
   * « ne te contente pas de masquer les boutons » vise.
   *
   * Comme pour le checkout d'acompte, la route est publique : le contrôle
   * porte sur le propriétaire de la fiche, jamais sur l'appelant. Message
   * neutre — un client final n'a pas à connaître l'abonnement du
   * professionnel.
   */
  const allowed = await detailerHasCapabilityBySlug(slug, 'booking.public');
  if (!allowed) {
    return Response.json(
      { error: 'booking_unavailable', message: 'Les réservations en ligne ne sont pas disponibles.' },
      { status: 403 },
    );
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
