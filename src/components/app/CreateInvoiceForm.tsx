'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/app/app.module.css';

export function CreateInvoiceForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/app/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: fd.get('clientName'),
          clientEmail: fd.get('clientEmail') || undefined,
          clientSiren: fd.get('clientSiren') || undefined,
          description: fd.get('description'),
          unitPriceHt: Number(fd.get('unitPriceHt')),
          quantity: Number(fd.get('quantity') || 1),
          tvaRate: Number(fd.get('tvaRate') || 20),
          tvaFranchise: fd.get('tvaFranchise') === 'on',
          issue: true,
        }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string; id?: string };
      if (!data.ok || !data.id) {
        setError(data.message || 'Erreur');
        return;
      }
      router.push(`/app/invoices/${data.id}`);
      router.refresh();
    } catch {
      setError('Erreur réseau');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
      <div className={styles.field}>
        <label htmlFor="clientName">Client (raison sociale)</label>
        <input id="clientName" name="clientName" required placeholder="Atelier Exemple SAS" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className={styles.field}>
          <label htmlFor="clientEmail">E-mail</label>
          <input id="clientEmail" name="clientEmail" type="email" placeholder="pro@exemple.fr" />
        </div>
        <div className={styles.field}>
          <label htmlFor="clientSiren">SIREN client</label>
          <input id="clientSiren" name="clientSiren" placeholder="123 456 789" />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="description">Prestation</label>
        <input
          id="description"
          name="description"
          required
          placeholder="Abonnement Qualifyr — mois en cours"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
        <div className={styles.field}>
          <label htmlFor="quantity">Qté</label>
          <input id="quantity" name="quantity" type="number" min="1" step="1" defaultValue={1} />
        </div>
        <div className={styles.field}>
          <label htmlFor="unitPriceHt">Prix HT (€)</label>
          <input id="unitPriceHt" name="unitPriceHt" type="number" min="0" step="0.01" required />
        </div>
        <div className={styles.field}>
          <label htmlFor="tvaRate">TVA %</label>
          <input id="tvaRate" name="tvaRate" type="number" min="0" step="0.1" defaultValue={20} />
        </div>
      </div>
      <label style={{ fontSize: '0.85rem', color: 'rgba(250,250,250,0.6)' }}>
        <input type="checkbox" name="tvaFranchise" style={{ marginRight: '0.4rem' }} />
        Franchise en base de TVA (art. 293 B du CGI)
      </label>
      <button className={`app-primary ${styles.btnPrimary}`} type="submit" disabled={pending} style={{ width: 'fit-content' }}>
        {pending ? 'Création…' : 'Émettre la facture'}
      </button>
      {error ? <p className={styles.error}>{error}</p> : null}
    </form>
  );
}
