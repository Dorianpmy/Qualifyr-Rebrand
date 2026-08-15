export type InvoiceStatus =
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type CreateInvoiceInput = {
  bookingId: string;
  amount: number;
  currency: 'EUR';
  status?: InvoiceStatus;
  customerName: string;
  customerEmail: string;
  items: { description: string; quantity: number; unitPrice: number }[];
};

export type Invoice = {
  id: string;
  bookingId: string;
  amount: number;
  currency: 'EUR';
  status: InvoiceStatus;
  customerName: string;
  customerEmail: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  createdAt: string;
};
