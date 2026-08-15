import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { EmbedSnippet } from '@/components/app/EmbedSnippet';
import { PricingEditor } from '@/components/app/PricingEditor';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { loadCatalogue } from '@/lib/detailing/pricing-admin';
import { getSessionUser } from '@/lib/detailing/session';
import styles from '../app.module.css';

// Les tarifs changent depuis cette page même : un instantané de build
// afficherait au professionnel la grille qu'il vient de remplacer.
export const dynamic = 'force-dynamic';

export default async function PrestationsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/app/login');

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) redirect('/app');

  const catalogue = await loadCatalogue(detailer.id);
  if (!catalogue) redirect('/app');

  const publicPath = `/reservation/${detailer.slug}`;

  return (
    <AppShell
      detailerName={detailer.name}
      detailerSlug={detailer.slug}
      city={detailer.city}
      active="tarifs"
    >
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.title}>Prestations</h1>
            <p className={styles.subtitle}>
              Ce que tu règles ici alimente directement ta page client ·{' '}
              <Link href={publicPath} target="_blank">
                {publicPath}
              </Link>
            </p>
          </div>
          <div className={styles.topActions}>
            <Link href={publicPath} className={styles.btnGhost} target="_blank">
              Voir la page client
            </Link>
          </div>
        </div>

        <div style={{ marginBlockEnd: '1.25rem' }}>
          <EmbedSnippet slug={detailer.slug} />
        </div>

        <PricingEditor catalogue={catalogue} />
      </main>
    </AppShell>
  );
}
