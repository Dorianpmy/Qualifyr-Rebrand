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

  async function onPasswordReset(event: FormEvent) {
    event.preventDefault();
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
        {/* `app-primary` (22/08/2026, revu) : un premier correctif posait
            `data-theme="dark"` sur cette page pour échapper au bouton vert de
            l'ancienne charte, puis `.cta-solid` pour échapper au reset de la
            charte sombre déclenché par cet attribut — ça marchait, mais ça
            recréait la même tension que le dashboard a déjà résolue autrement
            (voir le commentaire dans tailwind.css) : cette page n'a pas
            besoin de `data-theme="dark"` du tout. `[data-app='login']` (déjà
            posé sur le conteneur, `login/page.tsx`) neutralise l'ancienne
            charte tout seul ; `app-primary` reprend la main pour le fond
            blanc/texte encre, exactement comme les boutons d'action du
            tableau de bord. `.btn` garde la mise en page (largeur, hauteur,
            espacement). */}
        <button className={`${styles.btn} app-primary`} type="submit" disabled={pending}>
          {pending ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <p className={styles.loginDivider}>ou</p>

      <form onSubmit={onMagicLink}>
        <button className={styles.btnGhostLogin} type="submit" disabled={pending || !email}>
          Recevoir un lien magique
        </button>
      </form>

      {/* Définition du mot de passe (01/09/2026).

          Le champ « Mot de passe » ci-dessus existait depuis le début, et
          aucun écran ne permettait d'en créer un : tout compte né d'un lien
          magique — donc tous — se heurtait à un cul-de-sac. Le premier
          utilisateur réel a cru avoir raté une étape à l'inscription.

          Le libellé dit « définir ou changer » plutôt que « mot de passe
          oublié » : la plupart des comptes n'en ont jamais eu, et « oublié »
          leur ferait chercher une faute de leur côté. */}
      <form onSubmit={onPasswordReset}>
        <button className={styles.btnGhostLogin} type="submit" disabled={pending || !email}>
          Définir ou changer mon mot de passe
        </button>
      </form>

      {message ? <p className={styles.message}>{message}</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
