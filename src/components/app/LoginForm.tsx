'use client';

import { useState, type FormEvent } from 'react';
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
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      if (!data.ok) {
        setError(data.message);
      } else {
        setMessage(data.message);
      }
    } catch {
      setError('Envoi impossible. Réessayez.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className={styles.field}>
        <label htmlFor="app-email">E-mail professionnel</label>
        <input
          id="app-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@atelier.fr"
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
