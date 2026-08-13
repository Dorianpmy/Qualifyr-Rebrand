import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { CreateInvoiceForm } from '@/components/app/CreateInvoiceForm';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { formatMoney, listInvoicesForDetailer } from '@/lib/detailing/invoices';
import { getSessionUser } from '@/lib/detailing/session';
import styles from '../app.module.css';

const STATUS: Record<string, string> = {
  draft: 'Brouillon',
  issued: 'Émise',
  sent: 'Envoyée',
  paid: 'Payée',
  cancelled: 'Annulée',
};

export default async function InvoicesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/app/login');

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) redirect('/app');

  const invoices = await listInvoicesForDetailer(detailer.id);

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
            <h1 className={styles.title}>Factures</h1>
            <p className={styles.subtitle}>
              Numérotation continue · mentions FR · socle e-facture 2026
            </p>
          </div>
          <div className={styles.topActions}>
            <Link href="/app" className={styles.btnGhost}>
              ← Demandes
            </Link>
          </div>
        </div>

        <div className={styles.panel} style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <p className={styles.subtitle} style={{ marginBottom: '1rem' }}>
            Nouvelle facture pro (B2B). Renseigne le SIREN client dès que possible.
          </p>
          <CreateInvoiceForm />
        </div>

        <div className={styles.panel}>
          {invoices.length === 0 ? (
            <div className={styles.empty}>
              <strong>Aucune facture</strong>
              <p className={styles.emptyHint}>
                Crée ta première facture ci-dessus. Le numéro FA-AAAA-0001 est attribué
                automatiquement.
              </p>
            </div>
          ) : (
            <table className={styles.table} style={{ display: 'table' }}>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Client</th>
                  <th>Montant TTC</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span className={styles.clientName}>{inv.number}</span>
                    </td>
                    <td>
                      <span className={styles.clientName}>{inv.client_name}</span>
                      {inv.client_siren ? (
                        <div className={styles.clientMeta}>SIREN {inv.client_siren}</div>
                      ) : null}
                    </td>
                    <td>{formatMoney(Number(inv.amount_ttc))}</td>
                    <td>
                      <span className={styles.badge}>{STATUS[inv.status] ?? inv.status}</span>
                    </td>
                    <td>
                      <Link href={`/app/invoices/${inv.id}`} className={styles.btnGhost}>
                        Voir / PDF
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </AppShell>
  );
}
