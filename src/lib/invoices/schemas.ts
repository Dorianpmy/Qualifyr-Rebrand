import { z } from 'zod';

export const invoiceStatusSchema = z.enum([
  'pending',
  'confirmed',
  'paid',
  'failed',
  'refunded',
  'cancelled',
]);

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const createInvoiceSchema = z.object({
  bookingId: z.string().uuid('bookingId doit être un UUID valide'),
  amount: z.number().positive('Le montant doit être positif'),
  currency: z.literal('EUR'),
  status: invoiceStatusSchema.optional(),
  customerName: z.string().min(2, 'Nom du client requis').max(120),
  customerEmail: z.string().email('Adresse e-mail invalide').max(254),
  items: z
    .array(
      z.object({
        description: z.string().max(200),
        quantity: z.number().positive('Quantité invalide'),
        unitPrice: z.number().positive('Prix unitaire invalide'),
      }),
    )
    .min(1, 'Au moins un article est requis'),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type InvoiceItem = z.infer<typeof createInvoiceSchema>['items'][number];
