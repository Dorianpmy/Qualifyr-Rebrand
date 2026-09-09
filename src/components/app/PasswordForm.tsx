'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/app/app.module.css';

/**
 * Formulaire de définition du mot de passe.
 *
 * **La longueur minimale est aussi vérifiée côté serveur** (`set-password`).
 * Le contrôle ici évite un aller-retour inutile ; il ne protège rien, et le
 * retirer ne créerait pas de faille — c'est bien pour ça qu'il ne suffit pas.
 *
 * **Pas de confirmation par second champ.** Elle rassure sans rien vérifier :
 * une faute de frappe reproduite deux fois passe, et l'utilisateur qui colle
 * son mot de passe le colle deux fois. Le bouton d'affichage rend la saisie
 * relisible, ce qui attrape réellement les erreurs.
 */

const MIN_LENGTH = 12;

export function PasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const res = await fetch('/api/app/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };

      if (!data.ok) {
        setError(data.message);
        return;
      }

      setDone(true);
      /* Le mot de passe n'est jamais gardé en mémoire après l'envoi : rien ne
         le justifie, et un état React survit à la navigation côté client. */
      setPassword('');
      setTimeout(() => router.replace('/app'), 1200);
    } catch {
      setError('Enregistrement impossible. Réessayez.');
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <p className={styles.subtitle} role="status">
        Mot de passe enregistré. Retour à votre espace…
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div className={styles.field}>
        <label htmlFor="new-password">Nouveau mot de passe</label>
        <input
          id="new-password"
          type={visible ? 'text' : 'password'}
          required
          minLength={MIN_LENGTH}
          autoComplete="new-password"
          placeholder="Au moins 12 caractères"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          /* `aria-describedby` : la contrainte de longueur est annoncée par un
             lecteur d'écran au moment de la saisie, pas découverte au moment
             du refus. */
          aria-describedby="password-hint"
        />
        <small id="password-hint">
          Douze caractères minimum. Une phrase dont vous vous souvenez vaut mieux qu’une
          suite de symboles que vous devrez noter.
        </small>
      </div>

      <button
        type="button"
        className={styles.btnGhostLogin}
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
      >
        {visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      </button>

      {error ? (
        <p className={styles.subtitle} role="alert">
          {error}
        </p>
      ) : null}

      <button
        className={`${styles.btn} app-primary`}
        type="submit"
        disabled={pending || password.length < MIN_LENGTH}
      >
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}
