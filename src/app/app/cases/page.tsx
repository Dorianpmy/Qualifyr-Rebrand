import { redirect } from 'next/navigation';
import Image from 'next/image';
import { AppShell } from '@/components/app/AppShell';
import { LockedModule } from '@/components/app/LockedModule';
import { pageAccess } from '@/lib/billing/page-guard';
import { CreateCaseForm } from '@/components/app/CreateCaseForm';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { listCasesForDetailer } from '@/lib/detailing/cases';
import styles from '../app.module.css';

export default async function CasesPage() {
  /* Contrôle d'accès d'affichage. Il ne remplace pas celui des routes
     d'API — ce sont elles qui protègent les données — mais il évite
     d'afficher un module vide à quelqu'un qui ne l'a pas acheté. */
  const access = await pageAccess('gallery');
  if (!access.allowed) {
    return (
      <AppShell
        detailerName={access.user.email}
        detailerSlug=""
        city={null}
        active="abonnement"
      >
        <LockedModule reason={access.reason} capability="gallery" moduleName="Avant / Après" />
      </AppShell>
    );
  }
  const { user } = access;

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
                  {/* `next/image` plutôt qu'un `<img>` brut : compression
                      AVIF/WebP automatique et chargement différé — les
                      photos avant/après (souvent lourdes, prises au
                      téléphone) faisaient partie de la lenteur observée sur
                      ce module. Dimensions 4:3 pour coller à `.casePair img`
                      (aspect-ratio déjà fixé en CSS, object-fit: cover). */}
                  <Image
                    src={c.before_url}
                    alt={`${c.title} — avant`}
                    width={800}
                    height={600}
                    sizes="(min-width: 640px) 50vw, 100vw"
                  />
                  <Image
                    src={c.after_url}
                    alt={`${c.title} — après`}
                    width={800}
                    height={600}
                    sizes="(min-width: 640px) 50vw, 100vw"
                  />
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
