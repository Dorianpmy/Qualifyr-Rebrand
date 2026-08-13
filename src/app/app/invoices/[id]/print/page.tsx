import { notFound, redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { detailingServiceEnv } from '@/lib/detailing/env';
import { formatMoney, getInvoiceWithLines } from '@/lib/detailing/invoices';
import { getSessionUser } from '@/lib/detailing/session';

export default async function InvoicePrintPage({
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
  let legal: Record<string, string | null | boolean> = {};
  if (env) {
    const client = createClient(env.url, env.serviceRoleKey, {
      auth: { persistSession: false },
    });
    const { data } = await client
      .from('detailers')
      .select(
        'legal_name, siret, siren, tva_intra, legal_address, legal_city, legal_postal, rcs, capital',
      )
      .eq('id', detailer.id)
      .maybeSingle();
    if (data) legal = data as Record<string, string | null>;
  }

  const sellerName = (legal.legal_name as string) || detailer.name;
  const issued =
    invoice.issued_at != null
      ? new Intl.DateTimeFormat('fr-FR').format(new Date(invoice.issued_at))
      : '—';

  return (
    <html lang="fr">
      <head>
        <title>Facture {invoice.number}</title>
        <style>{`
          * { box-sizing: border-box; }
          body { font-family: system-ui, sans-serif; color: #111; margin: 2rem; font-size: 14px; }
          h1 { font-size: 1.4rem; margin: 0 0 0.25rem; }
          .muted { color: #555; font-size: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 1.5rem 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 1.25rem; }
          th, td { text-align: left; padding: 0.5rem 0.4rem; border-bottom: 1px solid #ddd; }
          th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #555; }
          .totals { margin-top: 1rem; text-align: right; }
          .totals strong { font-size: 1.1rem; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        `}</style>
      </head>
      <body>
        <p className="no-print muted">
          Utilise Cmd/Ctrl+P → Enregistrer en PDF
        </p>
        <h1>FACTURE {invoice.number}</h1>
        <p className="muted">Émise le {issued} · Prestation du {invoice.service_date ?? '—'}</p>

        <div className="grid">
          <div>
            <strong>Émetteur</strong>
            <div>{sellerName}</div>
            <div className="muted">
              {[legal.legal_address, legal.legal_postal, legal.legal_city].filter(Boolean).join(' ')}
            </div>
            {legal.siret ? <div className="muted">SIRET {String(legal.siret)}</div> : null}
            {legal.siren ? <div className="muted">SIREN {String(legal.siren)}</div> : null}
            {legal.tva_intra ? <div className="muted">TVA {String(legal.tva_intra)}</div> : null}
            {legal.rcs ? <div className="muted">{String(legal.rcs)}</div> : null}
            {legal.capital ? <div className="muted">Capital {String(legal.capital)}</div> : null}
          </div>
          <div>
            <strong>Client</strong>
            <div>{invoice.client_name}</div>
            {invoice.client_siren ? <div className="muted">SIREN {invoice.client_siren}</div> : null}
            {invoice.client_siret ? <div className="muted">SIRET {invoice.client_siret}</div> : null}
            {invoice.client_tva_intra ? (
              <div className="muted">TVA {invoice.client_tva_intra}</div>
            ) : null}
            {invoice.client_email ? <div className="muted">{invoice.client_email}</div> : null}
          </div>
        </div>

        <p className="muted">Catégorie d’opération : prestation de services</p>

        <table>
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

        <div className="totals">
          <div>Total HT : {formatMoney(Number(invoice.amount_ht))}</div>
          <div>
            TVA ({invoice.tva_rate} %) : {formatMoney(Number(invoice.amount_tva))}
          </div>
          <strong>Total TTC : {formatMoney(Number(invoice.amount_ttc))}</strong>
        </div>

        {invoice.tva_franchise ? (
          <p className="muted" style={{ marginTop: '1.25rem' }}>
            TVA non applicable, article 293 B du CGI (franchise en base de TVA).
          </p>
        ) : null}

        <p className="muted" style={{ marginTop: '1rem' }}>
          {invoice.payment_terms}
        </p>
        {invoice.notes ? <p className="muted">{invoice.notes}</p> : null}

        <script
          dangerouslySetInnerHTML={{
            __html: 'window.addEventListener("load",function(){setTimeout(function(){window.print()},300)})',
          }}
        />
      </body>
    </html>
  );
}
