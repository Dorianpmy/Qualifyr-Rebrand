import { NextResponse } from 'next/server';
import { detailerHasCapability } from '@/lib/billing/guard';
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

    /*
     * Trois raisons de ne pas relancer, traitées ensemble : pas de page
     * publiée, pas de paiement en ligne actif, ou un abonnement qui n'inclut
     * pas la relance.
     *
     * Le contrôle d'abonnement se fait ici, ligne par ligne, plutôt qu'à
     * l'entrée de la route : celle-ci est appelée par le planificateur avec
     * un secret partagé, sans utilisateur — il n'y a donc personne dont
     * vérifier les droits en tête de fonction. Ce qu'il faut vérifier, c'est
     * le droit du professionnel **propriétaire de chaque réservation**.
     *
     * Marquée quand même : sinon relue à chaque passage, sans jamais aboutir.
     */
    const recoveryAllowed = detailer
      ? await detailerHasCapability(String(row.detailer_id), 'booking.recovery')
      : false;

    if (!detailer?.slug || !detailer.stripe_charges_enabled || !recoveryAllowed) {
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
