import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { LockedModule } from '@/components/app/LockedModule';
import { pageAccess } from '@/lib/billing/page-guard';
import { EmbedSnippet } from '@/components/app/EmbedSnippet';
import { PaymentSetup } from '@/components/app/PaymentSetup';
import { PricingEditor } from '@/components/app/PricingEditor';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { loadCatalogue } from '@/lib/detailing/pricing-admin';
import styles from '../app.module.css';

// Les tarifs changent depuis cette page même : un instantané de build
// afficherait au professionnel la grille qu'il vient de remplacer.
export const dynamic = 'force-dynamic';

export default async function PrestationsPage() {
  /* Contrôle d'accès d'affichage. Il ne remplace pas celui des routes
     d'API — ce sont elles qui protègent les données — mais il évite
     d'afficher un module vide à quelqu'un qui ne l'a pas acheté. */
  const access = await pageAccess('services');
  if (!access.allowed) {
    return (
      <AppShell
        detailerName={access.user.email}
        detailerSlug=""
        city={null}
        active="abonnement"
      >
        <LockedModule reason={access.reason} capability="services" moduleName="Prestations" />
      </AppShell>
    );
  }
  const { user } = access;

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
            <Link href={publicPath} className={`app-ghost ${styles.btnGhost}`} target="_blank">
              Voir la page client
            </Link>
          </div>
        </div>

        <div style={{ marginBlockEnd: '1.25rem' }}>
          <EmbedSnippet slug={detailer.slug} />
        </div>

        {/* L'activation du paiement passe avant les tarifs : régler ses prix
            sans pouvoir encaisser l'acompte laisse le professionnel avec la
            moitié du produit, sans qu'il s'en aperçoive. */}
        <PaymentSetup />

        <PricingEditor catalogue={catalogue} />
      </main>
    </AppShell>
  );
}
