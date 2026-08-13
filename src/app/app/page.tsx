import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  formatPrice,
  formatSlot,
  getDetailerForOwner,
  listBookingsForDetailer,
  statusLabel,
} from '@/lib/detailing/dashboard';
import { getSessionUser } from '@/lib/detailing/session';
import styles from './app.module.css';

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'en_attente_paiement', label: 'En attente' },
  { key: 'confirme', label: 'Confirmées' },
  { key: 'realise', label: 'Réalisées' },
  { key: 'annule', label: 'Annulées' },
] as const;

function badgeClass(status: string): string {
  if (status === 'confirme' || status === 'realise') return `${styles.badge} ${styles.badgeConfirme}`;
  if (status === 'en_attente_paiement' || status === 'ajuste') return `${styles.badge} ${styles.badgeAttente}`;
  if (status === 'annule' || status === 'expire') return `${styles.badge} ${styles.badgeAnnule}`;
  return styles.badge;
}

export default async function AppHomePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/app/login');

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) {
    return (
      <>
        <header className={styles.header}>
          <div className={styles.brand}>
            Qualifyr <span>· Espace detailer</span>
          </div>
          <nav className={styles.nav}>
            <form action="/api/app/logout" method="post">
              <button type="submit">Déconnexion</button>
            </form>
          </nav>
        </header>
        <main className={styles.main}>
          <h1 className={styles.title}>Compte non lié</h1>
          <p className={styles.subtitle}>
            Votre e-mail ({user.email}) n’est pas encore rattaché à une fiche detailer.
            Dans Supabase, renseignez <code>detailers.owner_id</code> avec votre user id.
          </p>
        </main>
      </>
    );
  }

  const params = await searchParams;
  const status = params.status ?? 'all';
  const bookings = await listBookingsForDetailer(detailer.id, status);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.brand}>
          {detailer.name} <span>· Dashboard</span>
        </div>
        <nav className={styles.nav}>
          <Link href={`/reservation/${detailer.slug}`} target="_blank">
            Page publique
          </Link>
          <form action="/api/app/logout" method="post">
            <button type="submit">Déconnexion</button>
          </form>
        </nav>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Demandes</h1>
        <p className={styles.subtitle}>
          {detailer.city ? `${detailer.city} · ` : ''}
          /reservation/{detailer.slug}
        </p>

        <div className={styles.filters}>
          {FILTERS.map((filter) => (
            <Link
              key={filter.key}
              href={filter.key === 'all' ? '/app' : `/app?status=${filter.key}`}
              className={`${styles.filter} ${status === filter.key ? styles.filterActive : ''}`}
            >
              {filter.label}
            </Link>
          ))}
        </div>

        {bookings.length === 0 ? (
          <div className={styles.empty}>Aucune demande pour ce filtre.</div>
        ) : (
          <div className={styles.list}>
            {bookings.map((booking) => (
              <Link key={booking.id} href={`/app/bookings/${booking.id}`} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.cardTitle}>
                    {booking.vehicleSize}
                    {booking.vehicleModel ? ` · ${booking.vehicleModel}` : ''} · {booking.scope}
                  </span>
                  <span className={badgeClass(booking.status)}>{statusLabel(booking.status)}</span>
                </div>
                <div className={styles.meta}>
                  {formatSlot(booking.slotRaw)} · {formatPrice(booking.quotedPrice)} · {booking.email}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
