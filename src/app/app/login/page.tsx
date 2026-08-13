import { LoginForm } from '@/components/app/LoginForm';
import styles from '../app.module.css';

export default function AppLoginPage() {
  return (
    <div className={styles.loginShell}>
      <div className={styles.loginBox}>
        <h1>Espace detailer</h1>
        <p>Connexion par lien magique. Aucun mot de passe.</p>
        <LoginForm />
      </div>
    </div>
  );
}
