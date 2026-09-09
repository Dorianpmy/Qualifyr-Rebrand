'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/** Magic link — tokens dans le hash (#access_token=…). */
export default function AuthConfirmPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Connexion en cours…');

  useEffect(() => {
    async function run() {
      const hash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      const query = new URLSearchParams(window.location.search);
      const tokenHash = query.get('token_hash');
      const type = query.get('type') ?? 'email';

      if (!accessToken && !tokenHash) {
        setMessage('Lien invalide. Réessayez depuis /app/login.');
        return;
      }

      try {
        const res = await fetch('/api/app/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken,
            refreshToken,
            tokenHash,
            type,
          }),
        });
        const data = (await res.json()) as { ok: boolean; message?: string };
        if (!data.ok) {
          setMessage(data.message ?? 'Session impossible.');
          return;
        }
        /* Un lien de récupération mène à la définition du mot de passe, pas
           au tableau de bord : la session est établie, mais l'intention du
           professionnel était de choisir un mot de passe. L'envoyer sur son
           planning l'obligerait à retrouver l'écran par lui-même — et il n'y
           a pas de menu vers lui. */
        router.replace(type === 'recovery' ? '/app/mot-de-passe' : '/app');
      } catch {
        setMessage('Erreur réseau. Réessayez.');
      }
    }

    void run();
  }, [router]);

  return (
    <main style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#f4f1ea' }}>
      <p>{message}</p>
    </main>
  );
}
