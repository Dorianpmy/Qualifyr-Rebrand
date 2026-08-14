import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { CreateCaseForm } from '@/components/app/CreateCaseForm';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { listCasesForDetailer } from '@/lib/detailing/cases';
import { getSessionUser } from '@/lib/detailing/session';
import styles from '../app.module.css';

export default async function CasesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/app/login');

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) redirect('/app');

  const cases = await listCasesForDetailer(detailer.id);

  return (
    <AppShell
      detailerName={detailer.name}
      detailerSlug={detailer.slug}
      city={detailer.city}
      active="cases"
    >
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.title}>Avant / Après</h1>
            <p className={styles.subtitle}>
              Preuve sociale que Detailr ne pousse pas — tes résultats visibles pour convertir.
            </p>
          </div>
        </div>

        <div className={styles.panel} style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <CreateCaseForm />
        </div>

        {cases.length === 0 ? (
          <div className={styles.panel}>
            <div className={styles.empty}>
              <strong>Aucun case pour l’instant</strong>
              <p className={styles.emptyHint}>
                Ajoute 2–3 transformations. C’est l’axe “preuve” qui manque aux agendas purs.
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.caseGrid}>
            {cases.map((c) => (
              <article key={c.id} className={styles.caseCard}>
                <div className={styles.casePair}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.before_url} alt={`${c.title} — avant`} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.after_url} alt={`${c.title} — après`} />
                </div>
                <div className={styles.caseMeta}>
                  <strong>{c.title}</strong>
                  <span className={styles.clientMeta}>
                    {[c.vehicle_label, c.service_label].filter(Boolean).join(' · ') || '—'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
