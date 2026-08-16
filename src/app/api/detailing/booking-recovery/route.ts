import { NextResponse } from 'next/server';
import { sendAbandonedBookingEmail } from '@/lib/detailing/email';
import { formatMoney, profileFor } from '@/lib/detailing/locale';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import { siteUrl } from '@/lib/env';

/**
 * Relance des devis abandonnés.
 *
 * Une réservation dont le blocage de créneau (`hold_expires_at`) est dépassé
 * sans paiement reste en `en_attente_paiement` indéfiniment — rien ne la fait
 * expirer ailleurs dans le code. Cette route ne change pas ce statut : le lien
 * de paiement envoyé ici doit continuer à fonctionner (`/api/detailing/checkout`
 * refuse tout statut différent de `en_attente_paiement`), donc le créneau reste
 * réservable par le même client jusqu'à ce qu'un autre le prenne.
 *
 * Même principe que `review-dispatch` : secret en en-tête, plafond par
 * passage, marquage `abandon_reminder_sent_at` pour ne jamais relancer deux
 * fois — appelée toutes les quinze minutes par le planificateur.
 */

export const dynamic = 'force-dynamic';

/** Trente minutes après l'expiration du blocage : le temps d'un paiement lent
 *  ou d'un aller-retour réseau, sans laisser le client refroidir trop longtemps. */
const DELAY_MS = 30 * 60 * 1000;

/** Plafond par passage, pour ne pas vider le quota Resend sur un incident. */
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
    .select('id, detailer_id, email, quoted_price, deposit_amount, hold_expires_at')
    .eq('status', 'en_attente_paiement')
    .is('abandon_reminder_sent_at', null)
    .lte('hold_expires_at', threshold)
    .limit(BATCH);

  if (error) {
    return NextResponse.json({ error: 'Lecture impossible.' }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  const base = siteUrl();

  for (const row of rows ?? []) {
    const { data: detailer } = await supabase
      .from('detailers')
      .select('name, slug, country, stripe_charges_enabled')
      .eq('id', row.detailer_id)
      .single();

    // Sans page publiée ou sans paiement en ligne actif, aucun lien à
    // proposer. Marquée quand même : sinon relue à chaque passage, sans
    // jamais aboutir.
    if (!detailer?.slug || !detailer.stripe_charges_enabled) {
      await supabase
        .from('detailer_bookings')
        .update({ abandon_reminder_sent_at: new Date().toISOString() })
        .eq('id', row.id);
      skipped += 1;
      continue;
    }

    const profile = profileFor(detailer.country as string);
    const recoveryUrl = `${base}/reservation/${detailer.slug}/confirmation?booking=${row.id}`;

    const ok = await sendAbandonedBookingEmail({
      clientEmail: row.email as string,
      detailerName: detailer.name as string,
      quotedPriceLabel: formatMoney(Number(row.quoted_price), profile),
      depositLabel: formatMoney(Number(row.deposit_amount), profile),
      recoveryUrl,
    });

    if (ok) {
      await supabase
        .from('detailer_bookings')
        .update({ abandon_reminder_sent_at: new Date().toISOString() })
        .eq('id', row.id);
      sent += 1;
    } else {
      // Échec d'envoi (Resend indisponible, e-mail invalide...) : la ligne
      // reste en attente et sera reprise au passage suivant, plafonné par le
      // lot — pas de perte silencieuse, pas de boucle infinie non plus.
      console.warn('[booking-recovery] envoi échoué', row.id);
    }
  }

  return NextResponse.json({ examined: rows?.length ?? 0, sent, skipped });
}
