import { redirect } from 'next/navigation';
import { PasswordForm } from '@/components/app/PasswordForm';
import { getSessionUser } from '@/lib/detailing/session';
import styles from '@/app/app/app.module.css';

/**
 * Définition du mot de passe.
 *
 * **Un seul écran pour deux situations.** On y arrive soit par le lien reçu
 * après avoir cliqué « Définir un mot de passe » depuis la connexion — la
 * session vient alors du lien de récupération, échangé par
 * `/app/auth/confirm` —, soit depuis un compte déjà connecté qui veut en
 * changer. Le geste est le même, l'écran aussi.
 *
 * **Pas de garde par capacité.** Contrairement au reste de l'espace pro, cet
 * écran ne demande aucun abonnement : quelqu'un dont l'abonnement a expiré
 * doit pouvoir continuer d'accéder à son compte, ne serait-ce que pour
 * consulter ses factures. Une porte d'authentification ne se ferme pas pour
 * défaut de paiement.
 *
 * `dynamic` forcé : la session se lit dans les cookies, un instantané de
 * build renverrait tout le monde vers la page de connexion.
 */

export const dynamic = 'force-dynamic';

export default async function PasswordPage() {
  const user = await getSessionUser();
  if (!user) redirect('/app/login');

  return (
    <main className={styles.loginShell} data-app="login">
      <div style={{ width: '100%', maxWidth: '26rem' }}>
        <h1 className={styles.title}>Votre mot de passe</h1>
        <p className={styles.subtitle}>
          Choisissez un mot de passe pour {user.email}. Vous pourrez ensuite vous connecter
          sans passer par un lien à chaque fois.
        </p>
        <PasswordForm />
      </div>
    </main>
  );
}
