import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { StatusActions } from '@/components/app/StatusActions';
import {
  formatPrice,
  formatSlot,
  getBookingForDetailer,
  getDetailerForOwner,
  statusLabel,
} from '@/lib/detailing/dashboard';
import { getSessionUser } from '@/lib/detailing/session';
import styles from '../../app.module.css';

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/app/login');

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) redirect('/app');

  const { id } = await params;
  const booking = await getBookingForDetailer(detailer.id, id);
  if (!booking) notFound();

  return (
    <AppShell
      detailerName={detailer.name}
      detailerSlug={detailer.slug}
      city={detailer.city}
      active="demandes"
    >
      <main className={styles.main}>
        <Link href="/app" className={styles.back}>
          ← Demandes
        </Link>

        <div className={styles.topbar}>
          <div>
            <h1 className={styles.title}>
              {booking.vehicleSize}
              {booking.vehicleModel ? ` · ${booking.vehicleModel}` : ''}
            </h1>
            <p className={styles.subtitle}>
              {statusLabel(booking.status)} · {formatSlot(booking.slotRaw)}
            </p>
          </div>
        </div>

        <dl className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <dt>Client</dt>
            <dd>
              {booking.email}
              {booking.phone ? (
                <>
                  <br />
                  {booking.phone}
                </>
              ) : null}
            </dd>
          </div>
          <div className={styles.detailItem}>
            <dt>Prestation</dt>
            <dd>
              {booking.scope} · salissure {booking.soiling}
              <br />
              {booking.locationMode}
              {booking.postalCode ? ` · ${booking.postalCode}` : ''}
            </dd>
          </div>
          <div className={styles.detailItem}>
            <dt>Tarif annoncé</dt>
            <dd>
              {formatPrice(booking.quotedPrice)} · {booking.quotedMinutes} min
              <br />
              Acompte {formatPrice(booking.depositAmount)}
            </dd>
          </div>
          <div className={styles.detailItem}>
            <dt>Véhicule</dt>
            <dd>
              {booking.vehicleSize}
              {booking.plate ? ` · ${booking.plate}` : ''}
            </dd>
          </div>
        </dl>

        {booking.photos.length > 0 ? (
          <div className={styles.detailItem} style={{ marginBottom: '1.25rem' }}>
            <dt>Photos</dt>
            <div className={styles.photos}>
              {booking.photos.map((url, index) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  Photo {index + 1}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <StatusActions bookingId={booking.id} currentStatus={booking.status} />
      </main>
    </AppShell>
  );
}
