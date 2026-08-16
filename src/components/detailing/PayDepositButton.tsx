'use client';

import { useState } from 'react';

/**
 * Ouvre le paiement Stripe pour une réservation existante.
 *
 * Volontairement en style en ligne, sans dépendre des classes du tunnel de
 * réservation : cette page est atteinte depuis un e-mail, potentiellement
 * plusieurs jours après la visite initiale, et doit rester lisible même si le
 * reste du site change entre-temps. Un bouton de paiement invisible à cause
 * d'un conflit de spécificité CSS coûterait une vente, pas juste un défaut
 * visuel.
 */

export function PayDepositButton({
  bookingId,
  label,
}: {
  readonly bookingId: string;
  readonly label: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/detailing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = (await response.json()) as { url?: string; error?: string; message?: string };

      if (!response.ok || !data.url) {
        setError(data.message ?? data.error ?? 'Le paiement n’a pas pu être ouvert.');
        setPending(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError('Erreur réseau. Réessayez dans un instant.');
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '48px',
          padding: '0 1.5rem',
          borderRadius: '999px',
          border: 'none',
          backgroundColor: '#0e0e0f',
          color: '#ffffff',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: pending ? 'default' : 'pointer',
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? 'Ouverture du paiement…' : label}
      </button>
      {error ? (
        <p style={{ marginTop: '0.75rem', color: '#b3261e', fontSize: '0.9rem' }}>{error}</p>
      ) : null}
    </div>
  );
}
