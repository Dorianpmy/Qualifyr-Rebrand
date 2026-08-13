import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import {
  formatPrice,
  formatSlot,
  getBookingForDetailer,
  getDetailerForOwner,
  statusLabel,
} from '@/lib/detailing/dashboard';
import { getSessionUser } from '@/lib/detailing/session';
import { StatusActions } from '@/components/app/StatusActions';
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
    <>
      <header className={styles.header}>
        <div className={styles.brand}>
          {detailer.name} <span>· Demande</span>
        </div>
        <nav className={styles.nav}>
          <form action="/api/app/logout" method="post">
            <button type="submit">Déconnexion</button>
          </form>
        </nav>
      </header>

      <main className={styles.main}>
        <Link href="/app" className={styles.back}>
          ← Toutes les demandes
        </Link>

        <h1 className={styles.title}>
          {booking.vehicleSize}
          {booking.vehicleModel ? ` · ${booking.vehicleModel}` : ''}
        </h1>
        <p className={styles.subtitle}>
          {statusLabel(booking.status)} · {formatSlot(booking.slotRaw)}
        </p>

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
          <div className={styles.detailItem}>
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
    </>
  );
}
