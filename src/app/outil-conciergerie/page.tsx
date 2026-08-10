import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { buildMetadata } from '@/lib/metadata';
import { webPage } from '@/lib/structured-data';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/outil-conciergerie');

/** Adresse publique du produit, hébergé séparément du site d'agence. */
const appUrl = 'https://app.qualifyragence.com';

export default function ConciergeToolPage() {
  return (
    <>
      <JsonLd data={webPage('/outil-conciergerie')} />

      <Section ruled>
        <Container>
          <div className={styles.intro}>
            <div>
              <Eyebrow>Produit · Conciergeries</Eyebrow>
              <h1>Une page qui vous apporte des propriétaires.</h1>
            </div>
            <div className={styles.introCopy}>
              <p>
                Vous partagez un lien. Le propriétaire découvre ce que son bien pourrait rapporter,
                laisse ses coordonnées, et la demande arrive dans votre tableau de bord avec la
                ville, le logement et l’estimation déjà calculée.
              </p>
              <ul aria-label="Repères de l’offre">
                <li>79 € par mois</li>
                <li>Essai gratuit</li>
                <li>Sans engagement</li>
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section surface="sunken" ruled>
        <Container>
          <div className={styles.block}>
            <h2>Le propriétaire n’achète pas un service. Il évalue un risque.</h2>
            <p className={styles.lede}>
              Avant de confier un bien, il veut un chiffre. Tant qu’il ne l’a pas, il ne vous
              appelle pas — et vous ne saurez jamais qu’il a hésité.
            </p>
            <ol className={styles.list}>
              <li>
                <strong>Il ignore ce que son logement rapporterait</strong>
                <span>C’est la première question, et elle reste sans réponse sur la plupart des sites de conciergerie.</span>
              </li>
              <li>
                <strong>Votre offre ressemble à toutes les autres</strong>
                <span>Ménage, linge, accueil, annonces : la liste est la même partout.</span>
              </li>
              <li>
                <strong>Les demandes arrivent sans contexte</strong>
                <span>Ville, type de bien, disponibilité : tout est à redemander, et chaque échange s’allonge.</span>
              </li>
            </ol>
          </div>
        </Container>
      </Section>

      {/* Arithmétique du métier, pas résultats clients.
          Le produit vient d'être lancé : afficher une traction inventée se
          démonte en une recherche et ruine la crédibilité du reste. Ces
          ordres de grandeur sont vérifiables, et la note de méthode dit
          exactement d'où ils viennent. */}
      <Section ruled>
        <Container>
          <div className={styles.figures}>
            <p className={styles.figuresKicker}>L’arithmétique</p>
            <h2 className={styles.figuresTitle}>
              Un mandat signé paie quatre ans d’abonnement.
            </h2>

            <div className={styles.balance}>
              <div className={styles.balanceSide}>
                <p className={styles.balanceLabel}>Vous payez</p>
                <p className={styles.figure}>948 €</p>
                <p className={styles.figureLabel}>l’outil, sur douze mois</p>
              </div>

              <p className={styles.balanceSign} aria-hidden="true">
                contre
              </p>

              <div className={styles.balanceSide}>
                <p className={styles.balanceLabel}>Un seul mandat rapporte</p>
                <p className={`${styles.figure} ${styles.figureStrong}`}>3 000 – 5 000 €</p>
                <p className={styles.figureLabel}>par an, et tous les ans</p>
              </div>
            </div>

            <p className={styles.figuresNote}>
              Ordre de grandeur pour un logement générant 15 000 à 25 000 € de revenus annuels,
              avec une commission de 20 %. Ce ne sont pas des résultats clients : Qualifyr
              Conciergerie est en phase de lancement, et nous préférons le dire.
            </p>
          </div>
        </Container>
      </Section>

      <Section surface="sunken" ruled>
        <Container>
          <div className={styles.block}>
            <h2>Ce que l’outil fait, concrètement.</h2>
            <ol className={styles.list}>
              <li>
                <strong>Un simulateur à vos couleurs</strong>
                <span>Le propriétaire renseigne son bien en quatre choix et obtient une fourchette annuelle, la saisonnalité, et ce qui lui resterait après votre commission.</span>
              </li>
              <li>
                <strong>Vos barèmes, pas une moyenne nationale</strong>
                <span>Vous définissez vos secteurs et vos chiffres. C’est vous qui connaissez votre marché, et c’est vous qui assumez l’estimation.</span>
              </li>
              <li>
                <strong>Des demandes qualifiées</strong>
                <span>Chaque contact arrive avec le logement décrit et l’estimation figée telle qu’elle lui a été montrée.</span>
              </li>
              <li>
                <strong>Un tableau de bord et des notifications</strong>
                <span>Vous suivez le statut de chaque demande et recevez un e-mail dès qu’une nouvelle arrive.</span>
              </li>
            </ol>
          </div>
        </Container>
      </Section>

      <Section surface="sunken" ruled>
        <Container>
          <div className={styles.pricing}>
            <div className={styles.pricingCard}>
              <p className={styles.pricingKicker}>Tarif unique</p>

              <p className={styles.price}>
                79 € <span>par mois</span>
              </p>

              <ul className={styles.pricingList}>
                <li>Essai gratuit, sans carte bancaire</li>
                <li>Résiliable à tout moment</li>
                <li>Toutes les fonctions incluses, sans palier</li>
              </ul>

              <a className={styles.cta} href={appUrl} rel="noopener">
                Essayer gratuitement
              </a>

              <Link className={styles.secondary} href="/simulateur-revenus-locatifs">
                Voir le simulateur en démonstration
              </Link>
            </div>

            <div className={styles.pricingCopy}>
              <Eyebrow>Ce que ça remplace</Eyebrow>
              <h2>Un poste de dépense, pas un outil de plus.</h2>
              <p>
                Une page d’acquisition confiée à une agence coûte plusieurs milliers d’euros et
                demande des semaines. Un annuaire de mise en relation prélève une commission sur
                chaque mandat, à vie.
              </p>
              <p>
                Ici, vous payez un abonnement fixe, vous gardez vos propriétaires, et vous restez
                propriétaire de votre page.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className={styles.block}>
            <h2>Faut-il un outil ou un site&nbsp;?</h2>
            <p className={styles.lede}>
              Les deux répondent à des moments différents. Autant le dire clairement plutôt que de
              vous vendre le plus cher.
            </p>
            <div className={styles.compare}>
              <div>
                <h3>L’outil, à 79 €/mois</h3>
                <p>
                  Vous avez déjà une présence en ligne, ou vous démarrez et voulez d’abord des
                  demandes. Une page, en ligne en dix minutes, sans intervention de notre part.
                </p>
              </div>
              <div>
                <h3>Le site sur mesure</h3>
                <p>
                  Vous voulez une identité, plusieurs pages, votre ton et vos photographies. C’est
                  un projet d’agence, avec un accompagnement et un budget de quelques milliers
                  d’euros.
                </p>
              </div>
            </div>
            <p className={styles.lede}>
              Beaucoup de conciergeries commencent par l’outil et viennent au site une fois leur
              portefeuille constitué. L’inverse est rarement le bon ordre.
            </p>
            <div className={styles.footerActions}>
              <Link className={styles.secondary} href="/conciergerie">
                Découvrir l’offre de site pour conciergerie
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
