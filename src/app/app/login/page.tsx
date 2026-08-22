import Link from 'next/link';
import { LoginForm } from '@/components/app/LoginForm';
import styles from '../app.module.css';

/**
 * Entrée de l'espace professionnel.
 *
 * **C'est souvent le seul écran qu'un prospect voit avant de décider.** Le lien
 * « Espace pro » du site y mène ; quelqu'un qui hésite encore clique dessus
 * pour voir à quoi ressemble l'outil. Un formulaire nu sur fond gris répond
 * « rien à voir ici ».
 *
 * **Trois rappels de ce qui l'attend, pas un argumentaire.** La vente est
 * faite sur le site ; ici on rassure quelqu'un qui a déjà décidé, ou on donne
 * une raison de revenir à celui qui s'est trompé de porte. Trois lignes
 * suffisent — au-delà, l'écran devient une page de vente et le champ e-mail
 * descend sous la ligne de flottaison.
 *
 * **La sortie vers le site est explicite.** Un professionnel qui arrive ici
 * sans compte se retrouvait dans une impasse : ni inscription, ni retour.
 */

export const metadata = {
  title: 'Connexion — Espace professionnel Qualifyr',
  robots: { index: false, follow: false },
};

const reminders = [
  'Vos demandes, vos créneaux et vos acomptes au même endroit',
  'Vos tarifs modifiables à tout moment, sans nous appeler',
  'Vos factures aux normes françaises et suisses',
] as const;

export default function AppLoginPage() {
  return (
    /* `data-theme="dark"` (22/08/2026, signalé sur capture d'écran : les
       boutons "Se connecter" / "Recevoir un lien magique" s'affichaient en
       vert plein au lieu du style sombre à contour dégradé que définit déjà
       `app.module.css` — mêmes jetons `--accent-1/2/3` que le reste du site).
       Cet écran n'a qu'un wrapper `data-app="login"`, sans marqueur de
       thème : `globals.css` traite donc toute page qui l'utilise comme une
       page de l'ancienne charte claire et lui impose ses couleurs de bouton
       (`body:not(:has(main [data-theme='dark'])) button`, voir ce fichier).
       Même cause et même correctif que `BookingFlow.tsx` ce même jour : poser
       l'attribut ici neutralise tout le bloc d'un coup plutôt que de contrer
       chacune de ses règles une par une. */
    <div className={styles.loginShell} data-app="login" data-theme="dark">
      <div className={styles.loginBox}>
        <p className={styles.loginEyebrow}>Espace professionnel — nettoyage automobile</p>
        <h1>Le tableau de bord de votre activité.</h1>
        <p>
          Vos demandes, votre agenda et vos factures — pas l’espace de réservation de vos clients.
          Connectez-vous avec votre mot de passe, ou par lien e-mail si vous préférez ne pas en
          retenir un.
        </p>

        <LoginForm />

        <ul className={styles.loginPoints}>
          {reminders.map((item) => (
            <li key={item}>
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className={styles.loginCheck}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              >
                <path d="M3 8.5l3.2 3.2L13 4.8" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className={styles.loginFootnote}>
          Pas encore de compte ?{' '}
          <Link href="/#pricing-title">Découvrir Qualifyr et ses tarifs</Link>
        </p>
      </div>
    </div>
  );
}
