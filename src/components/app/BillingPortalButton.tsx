'use client';

import { useState } from 'react';
import styles from '@/app/app/app.module.css';

/**
 * Bouton d'ouverture du portail de facturation Stripe.
 *
 * **Il remplace le lien vers `/tarifs` pour qui est déjà abonné**, et la
 * différence n'est pas cosmétique : repasser par `/tarifs` crée un **second**
 * abonnement Stripe, facturé en plus du premier. Le portail, lui, modifie
 * l'abonnement existant et calcule le prorata — le client ne paie que la
 * différence sur la période en cours.
 *
 * Le libellé dit « gérer » plutôt que « changer d'offre » : la même page sert
 * aussi à changer de carte, télécharger ses factures et résilier. Promettre
 * une seule de ces actions ferait chercher les autres ailleurs.
 */
export function BillingPortalButton({ label = 'Gérer mon abonnement' }: { label?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setPending(true);
    setError(null);

    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = (await res.json()) as { ok: boolean; url?: string; message?: string };

      if (data.ok && data.url) {
        /* `location.assign` plutôt qu'un `<a>` : l'URL n'existe qu'après la
           réponse, et elle est à usage unique et de courte durée — la mettre
           dans un lien affiché exposerait une session de facturation dans
           l'historique du navigateur. */
        window.location.assign(data.url);
        return;
      }

      setError(data.message ?? 'Le portail n’a pas pu s’ouvrir.');
    } catch {
      setError('Le portail n’a pas pu s’ouvrir. Réessayez.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className={`app-ghost ${styles.btnGhost}`}
        onClick={open}
        disabled={pending}
      >
        {pending ? 'Ouverture…' : label}
      </button>
      {error ? (
        <p style={{ marginTop: '0.6rem', fontSize: '0.8125rem', color: '#d8a08a' }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
