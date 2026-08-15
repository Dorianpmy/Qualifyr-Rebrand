'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/app/app.module.css';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onPasswordLogin(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/app/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      if (data.ok) {
        router.replace('/app');
        router.refresh();
        return;
      }
      setError(data.message || 'Connexion impossible.');
    } catch {
      setError('Connexion impossible. Réessayez.');
    } finally {
      setPending(false);
    }
  }

  async function onMagicLink(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/app/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          redirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/app/auth/confirm`
              : undefined,
        }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      if (data.ok) setMessage(data.message);
      else setError(data.message || 'Envoi impossible.');
    } catch {
      setError('Envoi impossible. Réessayez.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <form onSubmit={onPasswordLogin}>
        <div className={styles.field}>
          <label htmlFor="email">E-mail professionnel</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@atelier.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className={styles.btn} type="submit" disabled={pending}>
          {pending ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <p className={styles.loginDivider}>ou</p>

      <form onSubmit={onMagicLink}>
        <button className={styles.btnGhostLogin} type="submit" disabled={pending || !email}>
          Recevoir un lien magique
        </button>
      </form>

      {message ? <p className={styles.message}>{message}</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
