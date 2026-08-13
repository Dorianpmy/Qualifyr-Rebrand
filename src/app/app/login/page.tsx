import { LoginForm } from '@/components/app/LoginForm';
import styles from '../app.module.css';

export default function AppLoginPage() {
  return (
    <div className={styles.loginBox}>
      <h1>Espace detailer</h1>
      <p>Recevez un lien de connexion par e-mail. Aucun mot de passe.</p>
      <LoginForm />
    </div>
  );
}
