'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '@/app/app/app.module.css';

/**
 * « Acompte reçu » — confirmation manuelle du paiement (mode virement ou lien
 * PayPal, docs/18-options-paiement-acompte.md §4).
 *
 * Distinct de `StatusActions` : celui-ci affirme quelque chose de précis
 * (« l'argent est arrivé »), pas seulement un changement de statut. Rendu
 * séparément, avec son propre libellé, pour que le professionnel ne le
 * confonde pas avec « Confirmer » — qui existait déjà avant ce mode et reste
 * disponible, mais ne pose pas la même traçabilité côté serveur.
 */
export function DepositConfirmButton({ bookingId }: { readonly bookingId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/app/bookings/${bookingId}/deposit-confirm`, {
        method: 'PATCH',
      });
      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!data.ok) {
        setError(data.message ?? 'Mise à jour impossible.');
        return;
      }
      router.refresh();
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.manualBlock} style={{ marginTop: '1rem' }}>
      <p className={styles.manualWarning}>
        Confirmez seulement une fois l’argent constaté sur votre compte ou votre PayPal — Qualifyr
        ne le vérifie pas.
      </p>
      <button type="button" className="app-primary" disabled={pending} onClick={confirm}>
        {pending ? '…' : 'Acompte reçu'}
      </button>
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
