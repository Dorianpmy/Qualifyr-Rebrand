import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
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
  const base = styles.badge ?? '';
  if (status === 'confirme' || status === 'realise') {
    return `${base} ${styles.badgeConfirme ?? ''}`.trim();
  }
  if (status === 'en_attente_paiement' || status === 'ajuste') {
    return `${base} ${styles.badgeAttente ?? ''}`.trim();
  }
  if (status === 'annule' || status === 'expire') {
    return `${base} ${styles.badgeAnnule ?? ''}`.trim();
  }
  return base;
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
      <div className={styles.loginShell}>
        <div className={styles.unlinked}>
          <h1 className={styles.title}>Compte non lié</h1>
          <p className={styles.subtitle}>
            {user.email} n’est pas rattaché à une fiche detailer.
            Renseigne <code>detailers.owner_id</code> dans Supabase.
          </p>
          <form action="/api/app/logout" method="post" style={{ marginTop: '1.25rem' }}>
            <button type="submit" className={styles.btnGhost}>
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const status = params.status ?? 'all';
  const all = await listBookingsForDetailer(detailer.id, 'all');
  const bookings = status === 'all' ? all : all.filter((b) => b.status === status);

  const pending = all.filter((b) => b.status === 'en_attente_paiement').length;
  const confirmed = all.filter((b) => b.status === 'confirme').length;
  const done = all.filter((b) => b.status === 'realise').length;
  const revenue = all
    .filter((b) => b.status === 'confirme' || b.status === 'realise')
    .reduce((sum, b) => sum + b.quotedPrice, 0);

  return (
    <AppShell
      detailerName={detailer.name}
      detailerSlug={detailer.slug}
      city={detailer.city}
      active="demandes"
    >
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.title}>Demandes</h1>
            <p className={styles.subtitle}>/reservation/{detailer.slug}</p>
          </div>
          <div className={styles.topActions}>
            <Link href={`/reservation/${detailer.slug}`} className={styles.btnGhost} target="_blank">
              Page publique
            </Link>
          </div>
        </div>

        <div className={styles.kpis}>
          <div className={styles.kpi}>
            <div className={styles.kpiLabel}>En attente</div>
            <div className={styles.kpiValue}>{pending}</div>
            <div className={styles.kpiHint}>À traiter</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiLabel}>Confirmées</div>
            <div className={styles.kpiValue}>{confirmed}</div>
            <div className={styles.kpiHint}>Au planning</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiLabel}>Réalisées</div>
            <div className={styles.kpiValue}>{done}</div>
            <div className={styles.kpiHint}>Terminées</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiLabel}>Volume</div>
            <div className={styles.kpiValue}>{formatPrice(revenue)}</div>
            <div className={styles.kpiHint}>Confirmé + réalisé</div>
          </div>
        </div>

        <div className={styles.filters}>
          {FILTERS.map((filter) => (
            <Link
              key={filter.key}
              href={filter.key === 'all' ? '/app' : `/app?status=${filter.key}`}
              className={`${styles.filter ?? ''} ${status === filter.key ? styles.filterActive ?? '' : ''}`.trim()}
            >
              {filter.label}
            </Link>
          ))}
        </div>

        <div className={styles.panel}>
          {bookings.length === 0 ? (
            <div className={styles.empty}>
              <strong>Aucune demande</strong>
              Partage le lien /reservation/{detailer.slug} à tes clients.
            </div>
          ) : (
            <>
              <div className={styles.mobileList}>
                {bookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/app/bookings/${booking.id}`}
                    className={styles.mobileCard}
                  >
                    <div className={styles.mobileCardTop}>
                      <span className={styles.clientName}>{booking.email}</span>
                      <span className={badgeClass(booking.status)}>
                        {statusLabel(booking.status)}
                      </span>
                    </div>
                    <div className={styles.clientMeta}>
                      {booking.vehicleSize}
                      {booking.vehicleModel ? ` · ${booking.vehicleModel}` : ''} ·{' '}
                      {formatPrice(booking.quotedPrice)}
                    </div>
                    <div className={styles.clientMeta}>{formatSlot(booking.slotRaw)}</div>
                  </Link>
                ))}
              </div>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Prestation</th>
                    <th>Créneau</th>
                    <th>Montant</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <Link href={`/app/bookings/${booking.id}`} className={styles.rowLink}>
                          <span className={styles.clientCell}>
                            <span className={styles.clientName}>{booking.email}</span>
                            <span className={styles.clientMeta}>
                              {booking.phone ?? 'Pas de téléphone'}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <Link href={`/app/bookings/${booking.id}`} className={styles.rowLink}>
                          {booking.vehicleSize}
                          {booking.vehicleModel ? ` · ${booking.vehicleModel}` : ''}
                          <div className={styles.clientMeta}>{booking.scope}</div>
                        </Link>
                      </td>
                      <td>
                        <Link href={`/app/bookings/${booking.id}`} className={styles.rowLink}>
                          {formatSlot(booking.slotRaw)}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/app/bookings/${booking.id}`} className={styles.rowLink}>
                          {formatPrice(booking.quotedPrice)}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/app/bookings/${booking.id}`} className={styles.rowLink}>
                          <span className={badgeClass(booking.status)}>
                            {statusLabel(booking.status)}
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </main>
    </AppShell>
  );
}
