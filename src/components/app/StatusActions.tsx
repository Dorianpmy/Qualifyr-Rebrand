'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '@/app/app/app.module.css';

const ACTIONS: { status: string; label: string; primary?: boolean }[] = [
  { status: 'confirme', label: 'Confirmer', primary: true },
  { status: 'ajuste', label: 'Marquer ajusté' },
  { status: 'realise', label: 'Marquer réalisé' },
  { status: 'annule', label: 'Annuler' },
];

export function StatusActions({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(status: string) {
    setPending(status);
    setError(null);
    try {
      const res = await fetch(`/api/app/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!data.ok) {
        setError(data.message ?? 'Erreur');
        return;
      }
      router.refresh();
    } catch {
      setError('Mise à jour impossible.');
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <div className={styles.actions}>
        {ACTIONS.filter((action) => action.status !== currentStatus).map((action) => (
          <button
            key={action.status}
            type="button"
            data-primary={action.primary ? 'true' : undefined}
            disabled={pending !== null}
            onClick={() => update(action.status)}
          >
            {pending === action.status ? '…' : action.label}
          </button>
        ))}
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
