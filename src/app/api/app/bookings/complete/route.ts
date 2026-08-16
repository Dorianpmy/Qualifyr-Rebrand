import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import { getSessionUser } from '@/lib/detailing/session';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { notifyVehicleReady } from '@/lib/detailing/whatsapp';
import { formatMoney, profileFor } from '@/lib/detailing/locale';

/**
 * « Véhicule terminé » — le professionnel appuie, le client est prévenu.
 *
 * **Un horodatage, pas seulement un statut.** `completed_at` marque l'instant
 * réel de la fin de prestation. C'est lui qui déclenche la demande d'avis
 * quelques heures plus tard : un statut peut être corrigé plusieurs fois, une
 * fin de prestation n'a lieu qu'une fois.
 *
 * **La notification n'est pas bloquante.** Si WhatsApp échoue — modèle non
 * encore validé, numéro invalide, réseau — la prestation reste marquée
 * terminée. L'inverse serait absurde : la voiture est lavée, que le message
 * parte ou non.
 */

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  bookingId: z.string().uuid(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const owned = await getDetailerForOwner(user.id);
  if (!owned) {
    return NextResponse.json({ error: 'Compte non rattaché.' }, { status: 403 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Base indisponible.' }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const { data: booking } = await supabase
    .from('detailer_bookings')
    .select(
      'id, detailer_id, status, completed_at, phone, quoted_price, deposit_amount, vehicle_model',
    )
    .eq('id', parsed.data.bookingId)
    .single();

  if (!booking) {
    return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 });
  }

  /*
   * La réservation doit appartenir au professionnel connecté. Sans ce
   * contrôle, l'identifiant d'une réservation suffirait à marquer terminée la
   * prestation d'un concurrent — et à déclencher un message à son client.
   */
  if (booking.detailer_id !== owned.id) {
    return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 });
  }

  if (booking.completed_at) {
    // Idempotent : un double clic ne renvoie pas un second message au client.
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  const { data: detailer } = await supabase
    .from('detailers')
    .select('name, country')
    .eq('id', booking.detailer_id)
    .single();

  const completedAt = new Date().toISOString();

  const { error } = await supabase
    .from('detailer_bookings')
    .update({ status: 'realise', completed_at: completedAt })
    .eq('id', booking.id)
    .is('completed_at', null);

  if (error) {
    return NextResponse.json({ error: 'Mise à jour impossible.' }, { status: 500 });
  }

  // --- Notification, hors du chemin critique --------------------------------

  let notified = false;

  if (booking.phone && detailer) {
    const profile = profileFor(detailer.country as string);
    const remaining = Number(booking.quoted_price) - Number(booking.deposit_amount);

    const result = await notifyVehicleReady({
      phone: booking.phone as string,
      country: (detailer.country as 'FR' | 'CH') ?? 'FR',
      // Le prénom n'est pas collecté par le tunnel : on s'adresse au véhicule,
      // ce qui reste juste et évite un « Bonjour undefined ».
      clientName: (booking.vehicle_model as string | null) ?? 'Bonjour',
      detailerName: detailer.name as string,
      remainingLabel: formatMoney(Math.max(0, remaining), profile),
    });

    notified = result.ok;

    if (result.ok) {
      await supabase
        .from('detailer_bookings')
        .update({ ready_notified_at: new Date().toISOString() })
        .eq('id', booking.id);
    } else {
      console.warn('[complete] notification non envoyée', booking.id, result.reason);
    }
  }

  return NextResponse.json({ ok: true, notified });
}
