import { productionUrl } from '@/content/site';
import styles from './PoweredByQualifyr.module.css';

/**
 * Crédit discret en pied de la page de réservation publique et du tunnel
 * embarqué (`/reservation/[slug]`, `/embed/[slug]`).
 *
 * **Pourquoi.** Chaque professionnel publie une page Qualifyr — parfois
 * embarquée sur son propre site. Un visiteur qui la trouve soignée n'a
 * aujourd'hui aucun moyen de savoir qui l'a conçue ni où en commander une
 * pour sa propre activité. Un crédit discret en bas de page règle ça sans
 * gêner la conversion du professionnel : il vient après le formulaire, pas
 * avant, et ne réutilise aucune couleur d'accent de la page.
 *
 * **Pas sur `/embed/[slug]?slug=demo`.** Cette variante est déjà l'iframe de
 * démonstration posée sur qualifyragence.com lui-même — le crédit y serait
 * redondant.
 *
 * **Le lien pointe vers la page d'accueil**, pas directement vers
 * `/creation-site-web` : le visiteur d'une page de réservation est un client
 * du professionnel, pas un prospect qualifié pour un site. La page d'accueil
 * présente l'ensemble de l'offre (SaaS et création de site) et laisse le
 * visiteur curieux se rediriger lui-même.
 */
export function PoweredByQualifyr() {
  return (
    <p className={styles.credit}>
      <a
        className={styles.link}
        href={productionUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-analytics-event="powered_by_qualifyr_clicked"
      >
        Propulsé par <span className={styles.brand}>Qualifyr</span>
      </a>
    </p>
  );
}
