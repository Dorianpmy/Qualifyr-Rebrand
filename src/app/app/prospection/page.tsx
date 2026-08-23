import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { LockedModule } from '@/components/app/LockedModule';
import { pageAccess } from '@/lib/billing/page-guard';
import { RequestZoneForm } from '@/components/app/RequestZoneForm';
import { claimZonesForDetailer, listZonesForDetailer } from '@/lib/agent/dashboard';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { SEGMENTS } from '@/lib/agent/sirene';
import styles from '../app.module.css';

/**
 * Prospection — la vitrine dans l'espace pro de ce que le formulaire public
 * ne fait que capturer.
 *
 * **`claimZonesForDetailer` avant la lecture.** Un detailer qui a testé
 * l'agent depuis le site vitrine, avant d'avoir un compte, retrouve ici ses
 * zones sans avoir à les redemander — le rattachement se fait sur l'e-mail,
 * silencieusement, à chaque chargement.
 */

export const dynamic = 'force-dynamic';

const SEGMENT_LABELS: Record<string, string> = Object.fromEntries(
  SEGMENTS.map((segment) => [segment.key, segment.label]),
);

const STATUS_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  en_cours: 'Analyse en cours',
  rapport_en_attente: 'Rapport en attente d’envoi',
  termine: 'Terminé',
  echec: 'Échec',
};

function badgeClass(status: string): string {
  const base = styles.badge ?? '';
  if (status === 'termine') return `${base} ${styles.badgeConfirme ?? ''}`.trim();
  if (status === 'en_attente' || status === 'en_cours' || status === 'rapport_en_attente') {
    return `${base} ${styles.badgeAttente ?? ''}`.trim();
  }
  return `${base} ${styles.badgeAnnule ?? ''}`.trim();
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    date,
  );
}

export default async function ProspectionPage() {
  /* Contrôle d'accès d'affichage. Il ne remplace pas celui des routes
     d'API — ce sont elles qui protègent les données — mais il évite
     d'afficher un module vide à quelqu'un qui ne l'a pas acheté. */
  const access = await pageAccess('agent.prospecting');
  if (!access.allowed) {
    return (
      <AppShell
        detailerName={access.user.email}
        detailerSlug=""
        city={null}
        active="abonnement"
      >
        <LockedModule reason={access.reason} capability="agent.prospecting" moduleName="Prospection" />
      </AppShell>
    );
  }
  const { user } = access;

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) redirect('/app');

  if (detailer.email) {
    await claimZonesForDetailer(detailer.id, detailer.email);
  }

  const zones = await listZonesForDetailer(detailer.id);

  return (
    <AppShell
      detailerName={detailer.name}
      detailerSlug={detailer.slug}
      city={detailer.city}
      active="prospection"
    >
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.title}>Prospection</h1>
            <p className={styles.subtitle}>
              L’agent recense les entreprises de votre secteur. À vous de les appeler.
            </p>
          </div>
        </div>

        <div className={styles.panel} style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <RequestZoneForm hasFreeZone={zones.length === 0} />
        </div>

        {zones.length === 0 ? (
          <div className={styles.panel}>
            <div className={styles.empty}>
              <strong>Aucune zone analysée pour l’instant</strong>
              <p className={styles.emptyHint}>
                Indiquez un code postal ci-dessus. Vous recevrez aussi un rapport par e-mail dès que
                l’analyse est terminée.
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.panel}>
            {zones.map((zone) => {
              const activeSegments = Object.entries(zone.segments ?? {}).filter(
                ([, count]) => Number(count) > 0,
              );

              return (
                <div
                  key={zone.id}
                  style={{
                    padding: '1rem 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <span className={styles.clientName}>{zone.postalCode}</span>
                      <span className={styles.clientMeta}>
                        {' '}
                        · {zone.isFree ? 'zone offerte' : 'incluse à l’abonnement'} · demandée le{' '}
                        {formatDate(zone.createdAt)}
                      </span>
                    </div>
                    <span className={badgeClass(zone.status)}>
                      {STATUS_LABELS[zone.status] ?? zone.status}
                    </span>
                  </div>

                  {zone.status === 'en_attente' && zone.errorMessage ? (
                    <p className={styles.emptyHint} style={{ marginTop: '0.4rem' }}>
                      Dernier passage en incident, nouvel essai automatique en cours.
                    </p>
                  ) : null}

                  {zone.status === 'termine' ? (
                    <>
                      <p className={styles.clientMeta} style={{ marginTop: '0.4rem' }}>
                        {zone.prospectCount} établissement{zone.prospectCount > 1 ? 's' : ''} trouvé
                        {zone.prospectCount > 1 ? 's' : ''}
                        {activeSegments.length > 0
                          ? ' · ' +
                            activeSegments
                              .map(([key, count]) => `${SEGMENT_LABELS[key] ?? key} (${count})`)
                              .join(' · ')
                          : ''}
                      </p>
                      {zone.prospectCount > 0 ? (
                        <Link
                          href={`/app/prospection/${zone.id}`}
                          className={styles.rowLink}
                          style={{ display: 'inline-block', marginTop: '0.5rem' }}
                        >
                          Voir les établissements →
                        </Link>
                      ) : null}
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}
