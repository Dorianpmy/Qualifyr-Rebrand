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
    /* Pas de `data-theme="dark"` ici (22/08/2026, revu) : un premier
       correctif l'avait ajouté pour échapper au bouton vert de l'ancienne
       charte (`body:not(:has(main [data-theme='dark'])) button` dans
       globals.css), mais cet attribut déclenche AUSSI le reset de fond de la
       charte sombre sur tout <button> sans `.cta-solid` — ce qui a rendu
       "Se connecter" transparent, donc invisible, une fois le vert parti.
       `data-app="login"` suffit : `tailwind.css` neutralise spécifiquement
       ce que l'ancienne charte impose sous `[data-app='login']`, sans
       toucher au reste (voir le commentaire là-bas) — même mécanisme,
       éprouvé, que le tableau de bord (`[data-app='dashboard']`). */
    <div className={styles.loginShell} data-app="login">
      <div className={styles.loginBox}>
        <p className={styles.loginEyebrow}>Espace professionnel — nettoyage automobile</p>
        <h1>Le tableau de bord de votre activité.</h1>
        <p>
          Vos demandes, votre agenda et vos factures — pas l’espace de réservation de vos clients.
          Connectez-vous, ou créez votre compte si c’est votre première visite.
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
          Vous découvrez seulement Qualifyr ?{' '}
          <Link href="/#pricing-title">Voir les tarifs</Link>
        </p>
      </div>
    </div>
  );
}
