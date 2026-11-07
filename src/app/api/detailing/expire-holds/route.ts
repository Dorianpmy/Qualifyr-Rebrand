import { NextResponse } from 'next/server';
import { expireStaleHolds } from '@/lib/detailing/holds';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';

/**
 * Expiration des blocages de créneau dépassés — `docs/13` §2.5.
 *
 * Passe en `expire` toutes les réservations en `en_attente_paiement` dont le
 * `hold_expires_at` est dépassé, tous professionnels confondus. Les demandes
 * sans blocage (mode manuel, pas d'acompte) ne sont jamais touchées.
 *
 * Ce passage n'est qu'un ménage : la liste des créneaux ignore déjà les
 * blocages dépassés, et `createBooking` les fait expirer avant chaque
 * insertion. Il garde surtout le tableau de bord du professionnel à jour.
 *
 * Même protection que les autres tâches planifiées : secret partagé en
 * en-tête, appelée par `netlify/functions/booking-expire-cron.ts`.
 */

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Base indisponible.' }, { status: 503 });
  }

  const expired = await expireStaleHolds(supabase);
  if (expired === null) {
    return NextResponse.json({ error: 'Mise à jour impossible.' }, { status: 500 });
  }

  return NextResponse.json({ expired });
}
