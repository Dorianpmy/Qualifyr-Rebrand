import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { detailingServiceEnv } from './env';

export type InvoiceStatus = 'draft' | 'issued' | 'sent' | 'paid' | 'cancelled';

export type InvoiceRow = {
  id: string;
  detailer_id: string;
  booking_id: string | null;
  number: string;
  sequence: number;
  status: InvoiceStatus;
  issued_at: string | null;
  service_date: string | null;
  client_name: string;
  client_email: string | null;
  client_siren: string | null;
  client_siret: string | null;
  client_tva_intra: string | null;
  client_address: string | null;
  client_city: string | null;
  client_postal: string | null;
  client_country: string | null;
  operation_category: 'goods' | 'service' | 'mixed';
  currency: string;
  amount_ht: number;
  tva_rate: number;
  amount_tva: number;
  amount_ttc: number;
  tva_franchise: boolean;
  notes: string | null;
  payment_terms: string | null;
  created_at: string;
};

export type InvoiceLine = {
  id: string;
  invoice_id: string;
  position: number;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  amount_ht: number;
};

function admin() {
  const env = detailingServiceEnv();
  if (!env) return null;
  return createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function formatMoney(centsOrEuros: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(centsOrEuros);
}

/** Alloue le prochain numéro FA-2026-0001 de façon atomique. */
export async function allocateInvoiceNumber(detailerId: string): Promise<{
  number: string;
  sequence: number;
} | null> {
  const client = admin();
  if (!client) return null;

  const { data: d, error } = await client
    .from('detailers')
    .select('invoice_prefix, invoice_next_number')
    .eq('id', detailerId)
    .single();

  if (error || !d) return null;

  const seq = Number(d.invoice_next_number ?? 1);
  const year = new Date().getFullYear();
  const prefix = (d.invoice_prefix as string) || 'FA';
  const number = `${prefix}-${year}-${String(seq).padStart(4, '0')}`;

  await client
    .from('detailers')
    .update({ invoice_next_number: seq + 1 })
    .eq('id', detailerId);

  return { number, sequence: seq };
}

export async function listInvoicesForDetailer(detailerId: string): Promise<InvoiceRow[]> {
  const client = admin();
  if (!client) return [];
  const { data } = await client
    .from('invoices')
    .select('*')
    .eq('detailer_id', detailerId)
    .order('created_at', { ascending: false });
  return (data as InvoiceRow[]) ?? [];
}

export async function getInvoiceWithLines(
  invoiceId: string,
  detailerId: string,
): Promise<{ invoice: InvoiceRow; lines: InvoiceLine[] } | null> {
  const client = admin();
  if (!client) return null;

  const { data: invoice } = await client
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('detailer_id', detailerId)
    .single();

  if (!invoice) return null;

  const { data: lines } = await client
    .from('invoice_lines')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('position', { ascending: true });

  return {
    invoice: invoice as InvoiceRow,
    lines: (lines as InvoiceLine[]) ?? [],
  };
}

export type CreateInvoiceInput = {
  detailerId: string;
  bookingId?: string | null;
  clientName: string;
  clientEmail?: string;
  clientSiren?: string;
  clientSiret?: string;
  clientTvaIntra?: string;
  clientAddress?: string;
  clientCity?: string;
  clientPostal?: string;
  serviceDate?: string;
  description: string;
  quantity?: number;
  unitPriceHt: number;
  tvaRate?: number;
  tvaFranchise?: boolean;
  notes?: string;
  issue?: boolean;
};

export async function createInvoice(input: CreateInvoiceInput): Promise<{ id: string; number: string } | null> {
  const client = admin();
  if (!client) return null;

  const allocated = await allocateInvoiceNumber(input.detailerId);
  if (!allocated) return null;

  const qty = input.quantity ?? 1;
  const rate = input.tvaFranchise ? 0 : (input.tvaRate ?? 20);
  const amountHt = Math.round(qty * input.unitPriceHt * 100) / 100;
  const amountTva = Math.round(amountHt * (rate / 100) * 100) / 100;
  const amountTtc = Math.round((amountHt + amountTva) * 100) / 100;

  const { data: inv, error } = await client
    .from('invoices')
    .insert({
      detailer_id: input.detailerId,
      booking_id: input.bookingId ?? null,
      number: allocated.number,
      sequence: allocated.sequence,
      status: input.issue ? 'issued' : 'draft',
      issued_at: input.issue ? new Date().toISOString() : null,
      service_date: input.serviceDate ?? new Date().toISOString().slice(0, 10),
      client_name: input.clientName,
      client_email: input.clientEmail ?? null,
      client_siren: input.clientSiren ?? null,
      client_siret: input.clientSiret ?? null,
      client_tva_intra: input.clientTvaIntra ?? null,
      client_address: input.clientAddress ?? null,
      client_city: input.clientCity ?? null,
      client_postal: input.clientPostal ?? null,
      operation_category: 'service',
      amount_ht: amountHt,
      tva_rate: rate,
      amount_tva: amountTva,
      amount_ttc: amountTtc,
      tva_franchise: Boolean(input.tvaFranchise),
      notes: input.notes ?? null,
    })
    .select('id, number')
    .single();

  if (error || !inv) return null;

  await client.from('invoice_lines').insert({
    invoice_id: inv.id,
    position: 1,
    description: input.description,
    quantity: qty,
    unit_price_ht: input.unitPriceHt,
    tva_rate: rate,
    amount_ht: amountHt,
  });

  return { id: inv.id as string, number: inv.number as string };
}
