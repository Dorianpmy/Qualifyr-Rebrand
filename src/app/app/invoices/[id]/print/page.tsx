import { notFound, redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { detailingServiceEnv } from '@/lib/detailing/env';
import { formatMoney, getInvoiceWithLines } from '@/lib/detailing/invoices';
import { getSessionUser } from '@/lib/detailing/session';
import { buildSwissQrBillPayload, renderQrBillSvg } from '@/lib/detailing/swiss-qr-bill';

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
        'legal_name, siret, siren, tva_intra, legal_address, legal_city, legal_postal, rcs, capital, country, iban',
      )
      .eq('id', detailer.id)
      .maybeSingle();
    if (data) legal = data as Record<string, string | null | boolean>;
  }

  const sellerName = (legal.legal_name as string) || detailer.name;
  const issued =
    invoice.issued_at != null
      ? new Intl.DateTimeFormat('fr-FR').format(new Date(invoice.issued_at))
      : '—';

  // QR-facture : seulement pour un émetteur suisse avec un IBAN CH/LI
  // renseigné (voir `swiss-qr-bill.ts`). `null` si les conditions ne sont pas
  // réunies — la facture reste alors un document classique, sans QR-bill
  // approximatif.
  const qrPayload =
    legal.country === 'CH' && legal.iban
      ? buildSwissQrBillPayload({
          iban: legal.iban as string,
          creditor: {
            name: sellerName,
            address: (legal.legal_address as string | null) ?? null,
            postalCode: (legal.legal_postal as string | null) ?? null,
            city: (legal.legal_city as string | null) ?? null,
            country: 'CH',
          },
          debtor: invoice.client_name
            ? {
                name: invoice.client_name,
                address: invoice.client_address,
                postalCode: invoice.client_postal,
                city: invoice.client_city,
                country: invoice.client_country ?? 'CH',
              }
            : null,
          amount: Number(invoice.amount_ttc),
          currency: invoice.currency ?? 'CHF',
          message: invoice.number,
        })
      : null;
  const qrSvg = qrPayload ? renderQrBillSvg(qrPayload) : null;

  return (
    <html lang="fr">
      <head>
        <title>Facture {invoice.number}</title>
        <style>{`
          * { box-sizing: border-box; }
          body { font-family: system-ui, sans-serif; color: #171513; margin: 0; background: #DCCFBD; font-size: 14px; }
          .sheet { max-width: 720px; margin: 0 auto; background: #FFFDF8; }
          .band { background: #171513; color: #F5F0E7; padding: 2.25rem 2.5rem 1.75rem; }
          .band h1 { font-family: Georgia, 'Times New Roman', serif; font-weight: 600; font-size: 1.9rem; margin: 0 0 0.3rem; color: #F5F0E7; }
          .band .meta { color: #DCCFBD; font-size: 12.5px; margin: 0; }
          .content { padding: 2rem 2.5rem 2.5rem; }
          .rule { height: 2px; width: 48px; background: #B08A52; border: none; margin: 0 0 1.5rem; }
          .muted { color: #70675F; font-size: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 0 0 1.5rem; }
          .grid .label { display: block; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #8B452F; font-weight: 600; margin-bottom: 0.35rem; }
          table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
          th, td { text-align: left; padding: 0.55rem 0.4rem; border-bottom: 1px solid #DED5C9; }
          th { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #70675F; font-weight: 600; }
          .totals { margin-top: 1rem; text-align: right; }
          .totals strong { font-family: Georgia, 'Times New Roman', serif; font-size: 1.4rem; font-weight: 600; color: #171513; }
          @media print {
            body { margin: 0; background: #fff; }
            .sheet { max-width: none; }
            .no-print { display: none; }
          }
          .qrbill { margin: 2rem 2.5rem 0; padding-top: 1.25rem; border-top: 2px dashed #DED5C9; page-break-inside: avoid; }
          .qrbill-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }
          .qrbill h2 { font-size: 0.9rem; margin: 0 0 0.5rem; text-transform: uppercase; letter-spacing: 0.04em; color: #171513; }
          .qrbill dl { margin: 0; font-size: 12px; }
          .qrbill dt { color: #70675F; margin-top: 0.5rem; }
          .qrbill dd { margin: 0; font-weight: 600; }
          .qrbill svg { display: block; margin-top: 0.5rem; }
        `}</style>
      </head>
      <body>
        <p className="no-print muted" style={{ padding: '1rem 2.5rem 0', maxWidth: 720, margin: '0 auto' }}>
          Utilise Cmd/Ctrl+P → Enregistrer en PDF
        </p>
        <div className="sheet">
        <div className="band">
          <h1>{sellerName}</h1>
          <p className="meta">Facture {invoice.number} · émise le {issued} · prestation du {invoice.service_date ?? '—'}</p>
        </div>
        <div className="content">
        <hr className="rule" />

        <div className="grid">
          <div>
            <span className="label">Émetteur</span>
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
            <span className="label">Client</span>
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
        </div>

        {/* QR-facture suisse — voir `swiss-qr-bill.ts` pour le détail du
            format. Ce n'est pas le gabarit pré-imprimé officiel de SIX
            (positions au millimètre, deux volets détachables) : c'est un
            bloc qui porte les mêmes informations et le même QR Code, lisible
            par toute app bancaire suisse. */}
        {qrSvg ? (
          <div className="qrbill">
            <p className="muted" style={{ marginBottom: '1rem' }}>
              QR-facture — à scanner dans votre app bancaire pour préremplir le paiement.
            </p>
            <div className="qrbill-grid">
              <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <dl>
                <dt>Compte / Payable à</dt>
                <dd>{legal.iban as string}</dd>
                <dd>{sellerName}</dd>
                <dt>Monnaie</dt>
                <dd>{invoice.currency ?? 'CHF'}</dd>
                <dt>Montant</dt>
                <dd>{formatMoney(Number(invoice.amount_ttc), invoice.currency ?? 'CHF')}</dd>
                <dt>Message</dt>
                <dd>{invoice.number}</dd>
                <dt>Payable par</dt>
                <dd>{invoice.client_name}</dd>
              </dl>
            </div>
          </div>
        ) : null}
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: 'window.addEventListener("load",function(){setTimeout(function(){window.print()},300)})',
          }}
        />
      </body>
    </html>
  );
}
