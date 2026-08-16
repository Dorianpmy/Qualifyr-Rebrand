import { NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import { googleReviewUrl, requestGoogleReview } from '@/lib/detailing/whatsapp';

/**
 * Envoi différé des demandes d'avis Google.
 *
 * **Pourquoi un traitement périodique et pas un envoi immédiat.** La demande
 * doit partir deux à trois heures après la restitution, quand le client a vu sa
 * voiture au soleil et sèche. Envoyée pendant qu'il sort son portefeuille, elle
 * arrive avant qu'il ait eu le temps d'être content.
 *
 * Cette route est prévue pour être appelée toutes les quinze minutes par un
 * planificateur — cron Vercel, tâche Supabase, ou n'importe quel service qui
 * sait faire une requête HTTP. Elle est volontairement sans état : elle traite
 * ce qui est mûr et s'arrête.
 *
 * **Elle est protégée par un secret.** Sans lui, n'importe qui pourrait la
 * déclencher en boucle et faire partir des dizaines de messages aux clients
 * d'un professionnel.
 */

export const dynamic = 'force-dynamic';

/** Trois heures : le temps du séchage et du premier regard. */
const DELAY_MS = 3 * 60 * 60 * 1000;

/** Plafond par passage, pour ne pas vider un quota WhatsApp sur un incident. */
const BATCH = 25;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Base indisponible.' }, { status: 503 });
  }

  const threshold = new Date(Date.now() - DELAY_MS).toISOString();

  const { data: rows, error } = await supabase
    .from('detailer_bookings')
    .select('id, detailer_id, phone, vehicle_model, completed_at')
    .not('completed_at', 'is', null)
    .is('review_requested_at', null)
    .not('phone', 'is', null)
    .lte('completed_at', threshold)
    .limit(BATCH);

  if (error) {
    return NextResponse.json({ error: 'Lecture impossible.' }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;

  for (const row of rows ?? []) {
    const { data: detailer } = await supabase
      .from('detailers')
      .select('name, country, google_place_id')
      .eq('id', row.detailer_id)
      .single();

    /*
     * Sans fiche Google, il n'y a nulle part où déposer un avis. On marque
     * quand même la ligne comme traitée : sinon elle serait relue à chaque
     * passage, indéfiniment, pour un professionnel qui n'a peut-être pas de
     * fiche et n'en aura jamais.
     */
    if (!detailer?.google_place_id) {
      await supabase
        .from('detailer_bookings')
        .update({ review_requested_at: new Date().toISOString() })
        .eq('id', row.id);
      skipped += 1;
      continue;
    }

    const result = await requestGoogleReview({
      phone: row.phone as string,
      country: (detailer.country as 'FR' | 'CH') ?? 'FR',
      clientName: (row.vehicle_model as string | null) ?? 'Bonjour',
      detailerName: detailer.name as string,
      reviewUrl: googleReviewUrl(detailer.google_place_id as string),
    });

    if (result.ok) {
      await supabase
        .from('detailer_bookings')
        .update({ review_requested_at: new Date().toISOString() })
        .eq('id', row.id);
      sent += 1;
    } else {
      /*
       * En cas d'échec, la ligne reste en attente et sera reprise au passage
       * suivant — une panne réseau ne doit pas faire perdre définitivement la
       * demande. Le risque de boucle est borné par le plafond de lot.
       */
      console.warn('[review] envoi échoué', row.id, result.reason);
    }
  }

  return NextResponse.json({ examined: rows?.length ?? 0, sent, skipped });
}
