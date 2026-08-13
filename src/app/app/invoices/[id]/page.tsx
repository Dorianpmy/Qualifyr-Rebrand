import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { AppShell } from '@/components/app/AppShell';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { detailingServiceEnv } from '@/lib/detailing/env';
import { formatMoney, getInvoiceWithLines } from '@/lib/detailing/invoices';
import { getSessionUser } from '@/lib/detailing/session';
import styles from '../../app.module.css';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/app/login');

  const detailer = await getDetailerForOwner(user.id);
  if (!detailer) redirect('/app');

  const { id } = await params;
  const packed = await getInvoiceWithLines(id, detailer.id);
  if (!packed) notFound();

  const { invoice, lines } = packed;

  const env = detailingServiceEnv();
  let legal: Record<string, string | null> = {};
  if (env) {
    const client = createClient(env.url, env.serviceRoleKey, {
      auth: { persistSession: false },
    });
    const { data } = await client
      .from('detailers')
      .select(
        'legal_name, siret, siren, tva_intra, legal_address, legal_city, legal_postal, rcs, capital, tva_franchise',
      )
      .eq('id', detailer.id)
      .maybeSingle();
    if (data) legal = data as Record<string, string | null>;
  }

  const sellerName = legal.legal_name || detailer.name;
  const issued =
    invoice.issued_at != null
      ? new Intl.DateTimeFormat('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }).format(new Date(invoice.issued_at))
      : '—';

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
            <h1 className={styles.title}>Facture {invoice.number}</h1>
            <p className={styles.subtitle}>Document prêt à imprimer / PDF</p>
          </div>
          <div className={styles.topActions}>
            <Link href="/app/invoices" className={styles.btnGhost}>
              ← Liste
            </Link>
            <button type="button" className={styles.btnPrimary} onClick={undefined}>
              {/* print via client note below */}
            </button>
          </div>
        </div>

        <div className={styles.topActions} style={{ display: 'flex', marginBottom: '1rem' }}>
          <Link href={`/app/invoices/${invoice.id}/print`} className={styles.btnPrimary} target="_blank">
            Ouvrir PDF / Imprimer
          </Link>
        </div>

        <div className={styles.panel} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <div className={styles.kpiLabel}>Émetteur</div>
              <strong>{sellerName}</strong>
              <div className={styles.clientMeta}>
                {[legal.legal_address, legal.legal_postal, legal.legal_city]
                  .filter(Boolean)
                  .join(' ')}
              </div>
              {legal.siret ? <div className={styles.clientMeta}>SIRET {legal.siret}</div> : null}
              {legal.tva_intra ? (
                <div className={styles.clientMeta}>TVA {legal.tva_intra}</div>
              ) : null}
            </div>
            <div>
              <div className={styles.kpiLabel}>Client</div>
              <strong>{invoice.client_name}</strong>
              {invoice.client_siren ? (
                <div className={styles.clientMeta}>SIREN {invoice.client_siren}</div>
              ) : null}
              {invoice.client_email ? (
                <div className={styles.clientMeta}>{invoice.client_email}</div>
              ) : null}
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }} className={styles.clientMeta}>
            Date d’émission : {issued} · Prestation : {invoice.service_date ?? '—'} · Catégorie :
            service
          </div>

          <table className={styles.table} style={{ display: 'table', marginTop: '1.25rem' }}>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qté</th>
                <th>P.U. HT</th>
                <th>Total HT</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.description}</td>
                  <td>{line.quantity}</td>
                  <td>{formatMoney(Number(line.unit_price_ht))}</td>
                  <td>{formatMoney(Number(line.amount_ht))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
            <div>Total HT : {formatMoney(Number(invoice.amount_ht))}</div>
            <div>
              TVA ({invoice.tva_rate} %) : {formatMoney(Number(invoice.amount_tva))}
            </div>
            <strong style={{ fontSize: '1.15rem' }}>
              Total TTC : {formatMoney(Number(invoice.amount_ttc))}
            </strong>
          </div>

          {invoice.tva_franchise ? (
            <p className={styles.clientMeta} style={{ marginTop: '1rem' }}>
              TVA non applicable — article 293 B du CGI (franchise en base).
            </p>
          ) : null}

          <p className={styles.clientMeta} style={{ marginTop: '1rem' }}>
            {invoice.payment_terms}
          </p>
        </div>
      </main>
    </AppShell>
  );
}
