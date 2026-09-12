'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/app/app.module.css';

/**
 * Connexion et création de compte — un seul écran, deux onglets.
 *
 * **Le lien magique a disparu (12/09/2026).** Il évitait de choisir un mot de
 * passe, mais dépendait d'un aller-retour e-mail à *chaque* connexion, et sa
 * redirection doit être exactement autorisée dans le projet Supabase — un
 * détail qui l'a rendu silencieusement inutilisable en production (l'e-mail
 * partait, le lien ramenait sur cet écran sans jamais ouvrir de session).
 * Un mot de passe choisi une fois à l'inscription règle les deux problèmes :
 * on se reconnecte sans e-mail, et il ne reste plus qu'un seul lien e-mail à
 * faire fonctionner correctement — celui de confirmation du compte.
 *
 * **La création de compte vit ici, pas sur un écran séparé.** Avant, la seule
 * façon d'obtenir un compte était de demander un lien magique — l'inscription
 * et la connexion étaient donc la même action, jamais nommée comme telle. Les
 * deux onglets rendent explicite ce qui se passait déjà en silence.
 *
 * **Pas de champ de confirmation du mot de passe.** Il rassure sans rien
 * vérifier : une faute de frappe reproduite deux fois passe quand même. Le
 * bouton d'affichage rend la saisie relisible, ce qui attrape réellement les
 * erreurs — même choix que `PasswordForm`.
 */

type Mode = 'signin' | 'signup';

const MIN_LENGTH = 12;

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setMessage(null);
    setError(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      if (mode === 'signin') {
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
      } else {
        const res = await fetch('/api/app/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = (await res.json()) as { ok: boolean; message: string };
        if (data.ok) {
          setMessage(data.message);
          // Le mot de passe est vidé de l'état une fois la requête envoyée.
          setPassword('');
        } else {
          setError(data.message || 'Création impossible.');
        }
      }
    } catch {
      setError(
        mode === 'signin' ? 'Connexion impossible. Réessayez.' : 'Création impossible. Réessayez.',
      );
    } finally {
      setPending(false);
    }
  }

  async function onPasswordReset() {
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      /* `redirectTo` n'est pas transmis : la route l'impose depuis l'origine
         de la requête. Une adresse forgée renverrait sinon le lien de
         récupération — donc la session — vers un domaine tiers. */
      const res = await fetch('/api/app/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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

  const signupInvalid = mode === 'signup' && password.length < MIN_LENGTH;

  return (
    <div>
      <div className={styles.modeSwitch} role="tablist" aria-label="Connexion ou création de compte">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          className={`${styles.modeTab} ${mode === 'signin' ? styles.modeTabActive : ''}`}
          onClick={() => switchMode('signin')}
        >
          Se connecter
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          className={`${styles.modeTab} ${mode === 'signup' ? styles.modeTabActive : ''}`}
          onClick={() => switchMode('signup')}
        >
          Créer un compte
        </button>
      </div>

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

        <div className={styles.field}>
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type={visible ? 'text' : 'password'}
            required
            minLength={mode === 'signup' ? MIN_LENGTH : undefined}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder={mode === 'signup' ? 'Au moins 12 caractères' : '••••••••'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={mode === 'signup' ? 'password-hint' : undefined}
          />
          {mode === 'signup' ? (
            <small id="password-hint">
              Douze caractères minimum. Une phrase dont vous vous souvenez vaut mieux qu’une suite
              de symboles que vous devrez noter.
            </small>
          ) : null}
        </div>

        <button
          type="button"
          className={styles.btnGhostLogin}
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
        >
          {visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        </button>

        <button
          className={`${styles.btn} app-primary`}
          type="submit"
          disabled={pending || signupInvalid}
        >
          {pending
            ? mode === 'signin'
              ? 'Connexion…'
              : 'Création…'
            : mode === 'signin'
              ? 'Se connecter'
              : 'Créer mon compte'}
        </button>
      </form>

      {mode === 'signin' ? (
        <button
          type="button"
          className={styles.forgotLink}
          onClick={onPasswordReset}
          disabled={pending || !email}
        >
          Mot de passe oublié ?
        </button>
      ) : null}

      {message ? (
        <p className={styles.message} role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
