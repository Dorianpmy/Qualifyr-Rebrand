import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { DepositConfirmButton } from '@/components/app/DepositConfirmButton';
import { StatusActions } from '@/components/app/StatusActions';
import {
  formatDuration,
  formatPrice,
  formatSlot,
  getBookingForDetailer,
  getDetailerForOwner,
  locationLabel,
  scopeLabel,
  soilingLabel,
  statusLabel,
  vehicleLabel,
} from '@/lib/detailing/dashboard';
import { directionsUrl, osmEmbedUrl } from '@/lib/detailing/geo';
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
              {scopeLabel(booking.scope)} · {soilingLabel(booking.soiling)}
              <br />
              {locationLabel(booking.locationMode, booking.postalCode)}
            </dd>
          </div>
          <div className={styles.detailItem}>
            <dt>Tarif annoncé</dt>
            <dd>
              {formatPrice(booking.quotedPrice)} · {formatDuration(booking.quotedMinutes)}
              <br />
              Acompte {formatPrice(booking.depositAmount)}
            </dd>
          </div>
          <div className={styles.detailItem}>
            <dt>Véhicule</dt>
            <dd>
              {vehicleLabel(booking)}
            </dd>
          </div>
        </dl>

        {/* Emplacement exact du véhicule.
            Un code postal ne suffit pas à un professionnel qui part avec son
            matériel : il lui faut la rue, et savoir s'il descend dans un
            parking souterrain avant de charger un nettoyeur sur roulettes. */}
        {booking.latitude !== null && booking.longitude !== null ? (
          <section className={styles.panel} style={{ padding: '1.1rem', marginBottom: '1.25rem' }}>
            <h2 className={styles.blockTitle ?? ''} style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>
              Où se trouve le véhicule
            </h2>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>
              {booking.address ?? 'Adresse non renseignée'}
            </p>
            {booking.accessNote ? (
              <p className={styles.clientMeta} style={{ margin: '0 0 0.75rem' }}>
                Accès : {booking.accessNote}
              </p>
            ) : null}
            <iframe
              title="Emplacement du véhicule"
              src={osmEmbedUrl({ lat: booking.latitude, lon: booking.longitude })}
              loading="lazy"
              style={{
                display: 'block',
                inlineSize: '100%',
                blockSize: '260px',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.7rem',
              }}
            />
            <div style={{ marginTop: '0.75rem' }}>
              <a
                className={`app-ghost ${styles.btnGhost}`}
                href={directionsUrl({ lat: booking.latitude, lon: booking.longitude })}
                target="_blank"
                rel="noreferrer"
              >
                Itinéraire
              </a>
            </div>
          </section>
        ) : null}

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

        {detailer.paymentMode === 'manuel' && booking.status === 'en_attente_paiement' ? (
          <DepositConfirmButton bookingId={booking.id} />
        ) : null}

        <StatusActions bookingId={booking.id} currentStatus={booking.status} />
      </main>
    </AppShell>
  );
}
