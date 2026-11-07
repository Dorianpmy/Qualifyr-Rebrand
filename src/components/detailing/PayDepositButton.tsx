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
 *
 * **Paiement en pleine page (07/11/2026).** Le bouton apparaît aussi à la fin
 * du formulaire intégré sur le site d'un professionnel, dans une iframe. Or
 * Stripe Checkout refuse de s'afficher dans une iframe. Le bouton remplace donc
 * la page entière (`window.top`), ou ouvre un nouvel onglet si le navigateur
 * l'interdit. Comme aucun navigateur ne signale de façon fiable un blocage,
 * un lien de secours s'affiche toujours après la tentative (`docs/13` §2.5).
 *
 * `tone` adapte les couleurs au fond : clair sur la page de confirmation,
 * sombre dans le parcours de réservation.
 */

type Tone = 'light' | 'dark';

const palette: Record<
  Tone,
  { readonly background: string; readonly color: string; readonly error: string; readonly muted: string }
> = {
  light: { background: '#0e0e0f', color: '#ffffff', error: '#9a3b1d', muted: '#4b5563' },
  // Terre cuite claire pour l'erreur : lisible sur fond charbon, sans rouge vif.
  dark: { background: '#ffffff', color: '#0e0e0f', error: '#f0b49a', muted: 'rgba(255, 255, 255, 0.72)' },
};

function isFramed(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Accès à `window.top` refusé : on est forcément dans une iframe.
    return true;
  }
}

/**
 * Navigue vers `url` au niveau de la page entière.
 *
 * Hors iframe : navigation normale. Dans une iframe : tentative sur
 * `window.top` (autorisée par les navigateurs sur un clic), puis nouvel onglet.
 */
function openPayment(url: string): void {
  if (!isFramed()) {
    window.location.href = url;
    return;
  }

  try {
    if (window.top) {
      window.top.location.href = url;
      return;
    }
  } catch {
    // Navigation de la page parente refusée : on tente l'onglet.
  }

  const tab = window.open(url, '_blank');
  if (tab) tab.opener = null;
}

export function PayDepositButton({
  bookingId,
  label,
  tone = 'light',
}: {
  readonly bookingId: string;
  readonly label: string;
  readonly tone?: Tone;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const colors = palette[tone];

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

      setFallbackUrl(data.url);
      openPayment(data.url);
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
          backgroundColor: colors.background,
          color: colors.color,
          fontSize: '1rem',
          fontWeight: 600,
          cursor: pending ? 'default' : 'pointer',
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? 'Ouverture du paiement…' : label}
      </button>
      {fallbackUrl ? (
        <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: colors.muted }}>
          Le paiement ne s’est pas ouvert ?{' '}
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            Ouvrir la page de paiement
          </a>
        </p>
      ) : null}
      {error ? (
        <p role="alert" style={{ marginTop: '0.75rem', color: colors.error, fontSize: '0.9rem' }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
