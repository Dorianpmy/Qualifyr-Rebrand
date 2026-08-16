'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/app/app.module.css';

/**
 * Demande d'analyse de secteur, depuis l'espace pro.
 *
 * Même logique que le formulaire du site vitrine, sans le champ e-mail : le
 * detailer est déjà identifié, `/api/app/agent-zones` utilise celui de sa
 * fiche.
 */

export function RequestZoneForm({ hasFreeZone }: { readonly hasFreeZone: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    const formData = new FormData(event.currentTarget);
    const zone = String(formData.get('zone') ?? '').trim();

    try {
      const response = await fetch('/api/app/agent-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        alreadyRequested?: boolean;
        requeued?: boolean;
      };

      if (!response.ok || !data.ok) {
        setError(data.message ?? data.error ?? 'La demande n’a pas pu être enregistrée.');
        return;
      }

      if (data.alreadyRequested) {
        setNotice('Cette zone est déjà en cours d’analyse.');
      } else {
        setNotice('Zone enregistrée. Le rapport arrive par e-mail sous quelques heures.');
      }

      (event.target as HTMLFormElement).reset();
      router.refresh();
    } catch {
      setError('Erreur réseau. Réessayez dans un instant.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.65rem' }}>
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className={styles.field} style={{ flex: '1 1 12rem' }}>
          <label htmlFor="zone">Code postal à démarcher</label>
          <input
            id="zone"
            name="zone"
            required
            inputMode="numeric"
            pattern="\d{5}"
            placeholder="69003"
          />
        </div>
        <button
          className={`app-primary ${styles.btnPrimary}`}
          type="submit"
          disabled={pending}
          style={{ width: 'fit-content' }}
        >
          {pending ? 'Envoi…' : hasFreeZone ? 'Analyser gratuitement' : 'Analyser cette zone'}
        </button>
      </div>
      <p className={styles.emptyHint}>
        L’agent liste les loueurs, VTC, concessions et flottes de transport du secteur — les
        professionnels avec des véhicules à entretenir. France uniquement pour l’instant.
      </p>
      {error ? <p className={styles.error}>{error}</p> : null}
      {notice ? <p className={styles.clientMeta}>{notice}</p> : null}
    </form>
  );
}
