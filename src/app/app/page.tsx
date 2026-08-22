import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import {
  formatDuration,
  formatPrice,
  formatSlot,
  formatSlotTime,
  getDetailerForOwner,
  holdRemaining,
  listBookingsForDetailer,
  locationLabel,
  scopeLabel,
  soilingLabel,
  statusLabel,
  vehicleLabel,
} from '@/lib/detailing/dashboard';
import { getSessionUser } from '@/lib/detailing/session';
import styles from './app.module.css';

/** Consigne d'accès — digicode, chien, place réservée. */
function AccessNoteIcon() {
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
      <circle cx="8" cy="15" r="3.2" />
      <path d="M10.3 12.7 18 5l2 2-1.6 1.6L20 10.2l-2 2-1.6-1.6L14 13" />
    </svg>
  );
}

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
      /* `data-app="login"` (22/08/2026, signalé sur capture d'écran : bouton
         "Déconnexion" en laiton). Cet écran réutilise `.loginShell` (même
         carte que `/app/login`) mais n'avait aucun `data-app` : sans lui,
         `globals.css` lui impose ses couleurs de bouton de l'ancienne charte,
         et le `app-ghost` déjà posé sur le bouton plus bas n'a aucune règle
         à laquelle s'accrocher (`[data-app='login'] .app-ghost` dans
         tailwind.css). Même mécanisme que `/app/login`. */
      <div className={styles.loginShell} data-app="login">
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

  const publicPath = `/reservation/${detailer.slug}`;

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
            <p className={styles.subtitle}>
              Pipeline réservations ·{' '}
              <Link href={publicPath} target="_blank">
                {publicPath}
              </Link>
            </p>
          </div>
          <div className={styles.topActions}>
            <Link href={publicPath} className={`app-ghost ${styles.btnGhost}`} target="_blank">
              Page publique
            </Link>
            <Link href={publicPath} className={`app-primary ${styles.btnPrimary}`} target="_blank">
              Partager le lien
            </Link>
          </div>
        </div>

        {/*
          Les deux sections que la barre d'onglets ne peut pas accueillir.

          La barre du téléphone ne tient que cinq emplacements (voir
          `AppShell.tsx`) : « Avant/Après » et « Factures » en sont sorties.
          Elles ne sont accessibles depuis nulle part ailleurs — les laisser
          hors de la barre sans ce relais les rendrait injoignables sur
          mobile, ce qui reviendrait à supprimer deux fonctionnalités au lieu
          de les déplacer.

          Ce bloc n'existe donc que sous 900 px : au-delà, les deux entrées
          sont dans le menu latéral, et les répéter ici ferait doublon.
        */}
        <nav className={styles.secondaryLinks} aria-label="Autres sections">
          <Link href="/app/cases" className={`app-ghost ${styles.btnGhost}`}>
            Avant / Après
          </Link>
          <Link href="/app/invoices" className={`app-ghost ${styles.btnGhost}`}>
            Factures
          </Link>
        </nav>

        <div className={styles.kpis}>
          <div className={`${styles.kpi} ${styles.kpiAccent}`}>
            <div className={styles.kpiLabel}>En attente</div>
            <div className={styles.kpiValue}>{pending}</div>
            <div className={styles.kpiHint}>À traiter en priorité</div>
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
              /* `app-filter` / `app-filter-active` : `styles.filter` et
                 `styles.filterActive` perdent tous deux contre le reset
                 `[data-app='dashboard'] a` de tailwind.css (règle calquée et
                 importante, qu'une classe de module CSS non calquée ne peut
                 pas battre, quelle que soit sa spécificité).

                 Seule la seconde avait été ajoutée le 22/08/2026, et elle ne
                 rendait que la couleur : la pastille sélectionnée était bien
                 blanche, mais les cinq restaient des rectangles à angles vifs
                 collés à leur texte. `app-filter` leur rend leur forme. */
              className={`${styles.filter ?? ''} app-filter ${status === filter.key ? `${styles.filterActive ?? ''} app-filter-active` : ''}`.trim()}
            >
              {filter.label}
            </Link>
          ))}
        </div>

        <div className={styles.panel}>
          {bookings.length === 0 ? (
            <div className={styles.empty}>
              <strong>Ton pipeline est vide</strong>
              <p className={styles.emptyHint}>
                Partage ta page de réservation. Chaque demande arrive ici avec estimation,
                créneau et photos — prêt à confirmer.
              </p>
              <div className={styles.emptyActions}>
                <Link href={publicPath} className={`app-primary ${styles.btnPrimary}`} target="_blank">
                  Ouvrir la page client
                </Link>
                <Link href={publicPath} className={`app-ghost ${styles.btnGhost}`} target="_blank">
                  Copier le parcours
                </Link>
              </div>
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
                      <span className={styles.clientName}>{vehicleLabel(booking)}</span>
                      <span className={badgeClass(booking.status)}>
                        {statusLabel(booking.status)}
                      </span>
                    </div>
                    <div className={styles.clientMeta}>
                      {scopeLabel(booking.scope)} · {soilingLabel(booking.soiling)} ·{' '}
                      {formatDuration(booking.quotedMinutes)}
                    </div>
                    <div className={styles.clientMeta}>
                      {formatSlot(booking.slotRaw)} ·{' '}
                      {locationLabel(booking.locationMode, booking.postalCode)} ·{' '}
                      {formatPrice(booking.quotedPrice)}
                    </div>
                    {/* Consigne d'accès : digicode, chien, place de parking —
                        saisie par le client à la réservation (AddressPicker),
                        déjà en base, jamais montrée nulle part avant la fiche
                        détail. Visible ici sans avoir à ouvrir chaque
                        réservation une à une. */}
                    {booking.accessNote ? (
                      <div className={styles.clientMeta}>
                        <AccessNoteIcon /> {booking.accessNote}
                      </div>
                    ) : null}
                    {holdRemaining(booking.holdExpiresAt) ? (
                      <div className={styles.hold}>{holdRemaining(booking.holdExpiresAt)}</div>
                    ) : null}
                  </Link>
                ))}
              </div>

              {/* Une seule zone cliquable par ligne.
                  Chaque cellule enveloppait son propre lien vers la même
                  destination : cinq liens identiques par réservation, que les
                  lecteurs d'écran annoncent tous. La ligne entière est
                  désormais cliquable via un seul lien, dans la première
                  colonne, étendu par CSS. */}
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Créneau</th>
                    <th>Véhicule</th>
                    <th>Prestation</th>
                    <th>Lieu</th>
                    <th>Montant</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const hold = holdRemaining(booking.holdExpiresAt);

                    return (
                      <tr key={booking.id} className={styles.row}>
                        <td>
                          <Link href={`/app/bookings/${booking.id}`} className={styles.rowLink}>
                            <span className={styles.slotTime}>
                              {formatSlotTime(booking.slotRaw)}
                            </span>
                            <span className={styles.clientMeta}>
                              {formatDuration(booking.quotedMinutes)}
                            </span>
                          </Link>
                        </td>
                        <td>
                          <span className={styles.clientName}>{vehicleLabel(booking)}</span>
                          <span className={styles.clientMeta}>
                            {booking.phone ?? booking.email}
                          </span>
                        </td>
                        <td>
                          {scopeLabel(booking.scope)}
                          <span className={styles.clientMeta}>
                            {soilingLabel(booking.soiling)}
                          </span>
                        </td>
                        <td>
                          {locationLabel(booking.locationMode, booking.postalCode)}
                          {booking.accessNote ? (
                            <span className={styles.clientMeta} title={booking.accessNote}>
                              <AccessNoteIcon /> Consigne d’accès
                            </span>
                          ) : null}
                        </td>
                        <td className={styles.amount}>{formatPrice(booking.quotedPrice)}</td>
                        <td>
                          <span className={badgeClass(booking.status)}>
                            {statusLabel(booking.status)}
                          </span>
                          {hold ? <span className={styles.hold}>{hold}</span> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      </main>
    </AppShell>
  );
}
