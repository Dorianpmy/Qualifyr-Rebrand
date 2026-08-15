'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/app/app.module.css';

export function CreateCaseForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/app/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fd.get('title'),
          vehicleLabel: fd.get('vehicleLabel') || undefined,
          serviceLabel: fd.get('serviceLabel') || undefined,
          beforeUrl: fd.get('beforeUrl'),
          afterUrl: fd.get('afterUrl'),
        }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!data.ok) {
        setError(data.message || 'Erreur');
        return;
      }
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch {
      setError('Erreur réseau');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.65rem' }}>
      <div className={styles.field}>
        <label htmlFor="title">Titre</label>
        <input id="title" name="title" required placeholder="Intérieur complet — SUV" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
        <div className={styles.field}>
          <label htmlFor="vehicleLabel">Véhicule</label>
          <input id="vehicleLabel" name="vehicleLabel" placeholder="Peugeot 3008" />
        </div>
        <div className={styles.field}>
          <label htmlFor="serviceLabel">Prestation</label>
          <input id="serviceLabel" name="serviceLabel" placeholder="Complet" />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="beforeUrl">URL photo avant</label>
        <input id="beforeUrl" name="beforeUrl" type="url" required placeholder="https://…" />
      </div>
      <div className={styles.field}>
        <label htmlFor="afterUrl">URL photo après</label>
        <input id="afterUrl" name="afterUrl" type="url" required placeholder="https://…" />
      </div>
      <button className={styles.btnPrimary} type="submit" disabled={pending} style={{ width: 'fit-content' }}>
        {pending ? 'Ajout…' : 'Ajouter le case'}
      </button>
      {error ? <p className={styles.error}>{error}</p> : null}
    </form>
  );
}
