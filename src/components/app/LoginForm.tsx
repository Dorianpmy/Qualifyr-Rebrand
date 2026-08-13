'use client';

import { FormEvent, useState } from 'react';
import styles from '@/app/app/app.module.css';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
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
    <form onSubmit={onSubmit}>
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
      <button className={styles.btn} type="submit" disabled={pending}>
        {pending ? 'Envoi…' : 'Recevoir le lien'}
      </button>
      {message ? <p className={styles.message}>{message}</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
    </form>
  );
}
