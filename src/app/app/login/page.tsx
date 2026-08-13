import { LoginForm } from '@/components/app/LoginForm';
import styles from '../app.module.css';

export default function AppLoginPage() {
  return (
    <div className={styles.loginShell}>
      <div className={styles.loginBox}>
        <p className={styles.loginEyebrow}>Qualifyr · Detailers</p>
        <h1>Remplis ton planning.</h1>
        <p>
          Parcours de réservation + estimation pour detailers en France et en Suisse.
          Connexion par lien magique — aucun mot de passe.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
