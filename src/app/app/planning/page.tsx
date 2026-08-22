import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { LockedModule } from '@/components/app/LockedModule';
import { pageAccess } from '@/lib/billing/page-guard';
import {
  formatDuration,
  formatSlotTime,
  getDetailerForOwner,
  listBookingsForDay,
  locationLabel,
  vehicleLabel,
} from '@/lib/detailing/dashboard';
import { directionsUrl } from '@/lib/detailing/geo';
import { orderRouteByNearestNeighbor } from '@/lib/detailing/route';
import styles from '../app.module.css';

/** Repère numéroté d'un arrêt de tournée — 1, 2, 3… l'ordre du trajet. */
function StopNumber({ index }: { index: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: '1.75rem',
        height: '1.75rem',
        borderRadius: '999px',
        border: '1px solid rgba(255,255,255,0.12)',
        fontSize: '0.78rem',
        fontWeight: 700,
        color: '#e0e0e0',
      }}
    >
      {index + 1}
    </span>
  );
}

/** Distance à vol d'oiseau entre deux arrêts — flèche vers le bas. */
function LegIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline', verticalAlign: '-1px' }}
    >
      <path d="M12 4v16M12 20l-4-4M12 20l4-4" />
    </svg>
  );
}

export default async function PlanningPage() {
  /* Contrôle d'accès d'affichage. Il ne remplace pas celui des routes
     d'API — ce sont elles qui protègent les données — mais il évite
     d'afficher un module vide à quelqu'un qui ne l'a pas acheté. */
  const access = await pageAccess('planning');
  if (!access.allowed) {
    return (
      <AppShell
        detailerName={access.user.email}
        detailerSlug=""
        city={null}
        active="abonnement"
      >
        <LockedModule reason={access.reason} capability="planning" moduleName="Planning" />
      </AppShell>
    );
  }
  const { user } = access;

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
            <button type="submit" className={`app-ghost ${styles.btnGhost}`}>
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    );
  }

  const today = new Date();
  const dayLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
  }).format(today);

  const todaysBookings = await listBookingsForDay(detailer.id, today);

  const hasBase = detailer.baseLatitude !== null && detailer.baseLongitude !== null;

  const route = hasBase
    ? orderRouteByNearestNeighbor(
        { lat: detailer.baseLatitude as number, lon: detailer.baseLongitude as number },
        todaysBookings,
      )
    : null;

  return (
    <AppShell
      detailerName={detailer.name}
      detailerSlug={detailer.slug}
      city={detailer.city}
      active="planning"
    >
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.title}>Tournée du jour</h1>
            <p className={styles.subtitle} style={{ textTransform: 'capitalize' }}>
              {dayLabel}
            </p>
          </div>
        </div>

        {!hasBase ? (
          <div className={styles.panel}>
            <div className={styles.empty}>
              <strong>Point de départ manquant</strong>
              <p className={styles.emptyHint}>
                La tournée se calcule depuis ton adresse de base. Renseigne-la dans Prestations
                pour que les arrêts d’aujourd’hui s’ordonnent du plus proche au plus loin.
              </p>
              <div className={styles.emptyActions}>
                <Link href="/app/prestations" className={`app-primary ${styles.btnPrimary}`}>
                  Régler mon adresse de base
                </Link>
              </div>
            </div>
          </div>
        ) : route && route.stops.length === 0 && route.unplaceable.length === 0 ? (
          <div className={styles.panel}>
            <div className={styles.empty}>
              <strong>Rien de confirmé aujourd’hui</strong>
              <p className={styles.emptyHint}>
                Les réservations confirmées pour {dayLabel.toLowerCase()} apparaîtront ici, dans
                l’ordre du trajet le plus court depuis ton point de départ.
              </p>
            </div>
          </div>
        ) : (
          <>
            {route && route.stops.length > 0 ? (
              <div className={styles.kpis} style={{ marginBottom: '1.15rem' }}>
                <div className={`${styles.kpi} ${styles.kpiAccent}`}>
                  <div className={styles.kpiLabel}>Arrêts</div>
                  <div className={styles.kpiValue}>{route.stops.length}</div>
                  <div className={styles.kpiHint}>Confirmés aujourd’hui</div>
                </div>
                <div className={styles.kpi}>
                  <div className={styles.kpiLabel}>Distance</div>
                  <div className={styles.kpiValue}>{route.totalDistanceKm.toFixed(1)} km</div>
                  <div className={styles.kpiHint}>À vol d’oiseau, depuis la base</div>
                </div>
              </div>
            ) : null}

            {route && route.stops.length > 0 ? (
              <div className={styles.panel} style={{ marginBottom: route.unplaceable.length > 0 ? '1rem' : 0 }}>
                {route.stops.map((stop, index) => (
                  <div
                    key={stop.booking.id}
                    className={styles.mobileCard}
                    style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}
                  >
                    <StopNumber index={index} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Le numéro d'arrêt et la carte entière ne sont pas un
                          lien : le bouton « Itinéraire » juste en dessous est
                          lui aussi cliquable, et deux liens imbriqués rompent
                          le clic du premier — voir la note sur `/app` pour le
                          même piège déjà rencontré ici. */}
                      <Link
                        href={`/app/bookings/${stop.booking.id}`}
                        style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
                      >
                        <div className={styles.mobileCardTop}>
                          <span className={styles.clientName}>{vehicleLabel(stop.booking)}</span>
                          <span className={styles.clientMeta}>{formatSlotTime(stop.booking.slotRaw)}</span>
                        </div>
                        <div className={styles.clientMeta}>
                          {locationLabel(stop.booking.locationMode, stop.booking.postalCode)} ·{' '}
                          {formatDuration(stop.booking.quotedMinutes)}
                        </div>
                        <div className={styles.clientMeta}>
                          <LegIcon /> {stop.distanceFromPreviousKm.toFixed(1)} km depuis{' '}
                          {index === 0 ? 'la base' : 'l’arrêt précédent'}
                        </div>
                        {stop.booking.accessNote ? (
                          <div className={styles.clientMeta}>Accès : {stop.booking.accessNote}</div>
                        ) : null}
                      </Link>
                      <div style={{ marginTop: '0.55rem' }}>
                        <a
                          href={directionsUrl(stop.point)}
                          target="_blank"
                          rel="noreferrer"
                          className={`app-ghost ${styles.btnGhost}`}
                          style={{ display: 'inline-flex' }}
                        >
                          Itinéraire
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {route && route.unplaceable.length > 0 ? (
              <div className={styles.panel}>
                <div style={{ padding: '0.85rem 1.1rem 0.35rem', fontSize: '0.78rem', color: 'var(--color-faint)' }}>
                  Sans position exploitable — non inclus dans le trajet
                </div>
                {route.unplaceable.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/app/bookings/${booking.id}`}
                    className={styles.mobileCard}
                  >
                    <div className={styles.mobileCardTop}>
                      <span className={styles.clientName}>{vehicleLabel(booking)}</span>
                      <span className={styles.clientMeta}>{formatSlotTime(booking.slotRaw)}</span>
                    </div>
                    <div className={styles.clientMeta}>
                      {locationLabel(booking.locationMode, booking.postalCode)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </>
        )}
      </main>
    </AppShell>
  );
}
