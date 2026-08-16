import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { getZoneForDetailer, listProspectsForZone } from '@/lib/agent/dashboard';
import { SEGMENTS } from '@/lib/agent/sirene';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { getSessionUser } from '@/lib/detailing/session';
import styles from '../../app.module.css';

export const dynamic = 'force-dynamic';

const SEGMENT_LABELS: Record<string, string> = Object.fromEntries(
  SEGMENTS.map((segment) => [segment.key, segment.label]),
);

export default async function ProspectionZonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/app/login');

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) redirect('/app');

  const { id } = await params;
  const zone = await getZoneForDetailer(id, detailer.id);
  if (!zone) notFound();

  const prospects = await listProspectsForZone(id, detailer.id);

  return (
    <AppShell
      detailerName={detailer.name}
      detailerSlug={detailer.slug}
      city={detailer.city}
      active="prospection"
    >
      <main className={styles.main}>
        <Link href="/app/prospection" className={styles.back}>
          ← Prospection
        </Link>

        <div className={styles.topbar}>
          <div>
            <h1 className={styles.title}>Autour du {zone.postalCode}</h1>
            <p className={styles.subtitle}>
              {prospects.length} établissement{prospects.length > 1 ? 's' : ''} — répertoire Sirene
              de l’INSEE, entreprises en activité.
            </p>
          </div>
        </div>

        {prospects.length === 0 ? (
          <div className={styles.panel}>
            <div className={styles.empty}>
              <strong>Rien à afficher</strong>
              <p className={styles.emptyHint}>Aucun établissement retenu sur cette zone.</p>
            </div>
          </div>
        ) : (
          <div className={styles.panel}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Établissement</th>
                  <th>Segment</th>
                  <th>Localisation</th>
                  <th>Effectif</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((prospect) => (
                  <tr key={prospect.id} className={styles.row}>
                    <td>
                      <span className={styles.clientName}>{prospect.name}</span>
                      {prospect.address ? (
                        <span className={styles.clientMeta}>{prospect.address}</span>
                      ) : null}
                    </td>
                    <td>{SEGMENT_LABELS[prospect.segment] ?? prospect.segment}</td>
                    <td>
                      {[prospect.postalCode, prospect.city].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td>{prospect.workforceRange ?? '—'}</td>
                    <td>
                      {prospect.phone ? <div>{prospect.phone}</div> : null}
                      {prospect.website ? (
                        <a
                          className={styles.rowLink}
                          href={prospect.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Site
                        </a>
                      ) : null}
                      {!prospect.phone && !prospect.website ? '—' : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/*
          RGPD : ces établissements n'ont rien demandé. La source et la base
          légale sont dites ici pour qu'un professionnel qui contacte l'un
          d'eux puisse répondre à la question « d'où venez-vous ». Elles sont
          aussi stockées par prospect (`source`, `legal_basis`) pour répondre
          au cas par cas si besoin.
        */}
        <p className={styles.emptyHint} style={{ marginTop: '1rem' }}>
          Source : répertoire Sirene de l’INSEE. Base légale : intérêt légitime à la prospection
          commerciale B2B. Ce sont des entreprises, pas des particuliers.
        </p>
      </main>
    </AppShell>
  );
}
