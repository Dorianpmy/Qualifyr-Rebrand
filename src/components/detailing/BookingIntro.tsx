import Image from 'next/image';
import type { DetailerCase } from '@/lib/detailing/cases';
import { formatMoney, profileFor } from '@/lib/detailing/locale';
import styles from './BookingIntro.module.css';

/**
 * En-tête de la page publique de réservation.
 *
 * **Ce qu'il corrige.** Le visiteur arrivait directement sur « Étape 1 sur 7 :
 * le véhicule », sans savoir combien ça coûte, combien de temps ça prend, ni
 * qui est en face. Un formulaire de sept étapes demandé avant le premier
 * argument, c'est un formulaire qu'on abandonne.
 *
 * L'ordre suit les trois questions qu'un particulier se pose, dans cet ordre :
 * combien, avec quel résultat, et que se passe-t-il si ça se passe mal.
 */

export type BookingIntroProps = {
  readonly name: string;
  readonly city: string | null;
  readonly country: string;
  readonly intro: string | null;
  readonly yearsExperience: number | null;
  readonly insuranceLabel: string | null;
  readonly freeCancellationHours: number;
  readonly mobileService: boolean;
  readonly workshopService: boolean;
  readonly depositEnabled: boolean;
  /** Prix plancher réel du catalogue, jamais une valeur écrite en dur. */
  readonly startingPrice: number | null;
  readonly shortestMinutes: number | null;
  readonly cases: readonly DetailerCase[];
};

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${String(rest).padStart(2, '0')}`;
}

export function BookingIntro({
  name,
  city,
  country,
  intro,
  yearsExperience,
  insuranceLabel,
  freeCancellationHours,
  mobileService,
  workshopService,
  depositEnabled,
  startingPrice,
  shortestMinutes,
  cases,
}: BookingIntroProps) {
  const profile = profileFor(country);

  // Le lieu d'intervention est une promesse : elle ne s'affiche que si la
  // fiche la tient réellement.
  const placeLine =
    mobileService && workshopService
      ? 'Chez vous ou à l’atelier, au choix'
      : mobileService
        ? 'Le professionnel se déplace chez vous'
        : 'Dépôt du véhicule à l’atelier';

  const reassurances = [
    {
      title: 'Le prix affiché est le prix payé',
      body: `Il est calculé pendant que vous choisissez, pas envoyé sous 48 h. ${name} vérifie le véhicule à son arrivée ; si l’état diffère de ce que vous avez décrit, il vous propose un montant ajusté et vous restez libre de refuser.`,
    },
    {
      title: `Annulation gratuite jusqu’à ${freeCancellationHours} h avant`,
      body: depositEnabled
        ? 'L’acompte bloque le créneau. Passé ce délai il reste acquis, avant, il vous est rendu intégralement.'
        : 'Aucun montant n’est prélevé à la réservation.',
    },
    {
      title: 'Une heure de restitution, pas une fourchette',
      body: 'La durée est calculée à partir de la taille du véhicule, de la formule et de l’état déclaré. Vous savez à quelle heure vous récupérez la voiture avant même de réserver.',
    },
  ];

  const proof = cases.slice(0, 3);

  return (
    <header className={styles.intro}>
      <div className={styles.head}>
        <p className={styles.eyebrow}>
          {name}
          {city ? ` · ${city}` : ''}
          {yearsExperience ? ` · ${yearsExperience} ans de métier` : ''}
        </p>

        <h1 className={styles.title}>
          Votre devis en trois minutes,
          <br />
          votre créneau réservé dans la foulée.
        </h1>

        <p className={styles.lede}>
          {intro ??
            `Vous décrivez votre véhicule, le prix et la durée s’affichent immédiatement. Vous choisissez l’heure qui vous arrange, et le créneau est bloqué. Aucun appel, aucun devis à attendre.`}
        </p>

        {/* Les trois faits qu'un visiteur cherche avant de lire quoi que ce
            soit d'autre. Le prix plancher vient du catalogue réel : écrit en
            dur, il finirait par mentir dès la première hausse de tarif. */}
        <dl className={styles.facts}>
          {startingPrice !== null ? (
            <div className={styles.fact}>
              <dt>À partir de</dt>
              <dd>{formatMoney(startingPrice, profile)}</dd>
            </div>
          ) : null}
          {shortestMinutes !== null ? (
            <div className={styles.fact}>
              <dt>Dès</dt>
              <dd>{formatDuration(shortestMinutes)}</dd>
            </div>
          ) : null}
          <div className={styles.fact}>
            <dt>Lieu</dt>
            <dd className={styles.factText}>{placeLine}</dd>
          </div>
        </dl>
      </div>

      {proof.length > 0 ? (
        <section className={styles.proof} aria-labelledby="booking-proof-title">
          <h2 id="booking-proof-title" className={styles.proofTitle}>
            Des véhicules déjà passés entre ses mains
          </h2>
          <p className={styles.proofLede}>
            Un nettoyage ne se juge pas sur une promesse. Voici l’avant et l’après, sur de vrais
            véhicules de clients.
          </p>

          <ul className={styles.proofGrid}>
            {proof.map((item) => (
              <li key={item.id} className={styles.proofCard}>
                <div className={styles.proofPair}>
                  <figure className={styles.proofFigure}>
                    <Image
                      src={item.before_url}
                      alt={`${item.title} — avant intervention`}
                      width={480}
                      height={360}
                      className={styles.proofImage}
                      sizes="(max-width: 800px) 45vw, 220px"
                    />
                    <figcaption>Avant</figcaption>
                  </figure>
                  <figure className={styles.proofFigure}>
                    <Image
                      src={item.after_url}
                      alt={`${item.title} — après intervention`}
                      width={480}
                      height={360}
                      className={styles.proofImage}
                      sizes="(max-width: 800px) 45vw, 220px"
                    />
                    <figcaption>Après</figcaption>
                  </figure>
                </div>
                <p className={styles.proofCaption}>
                  <strong>{item.vehicle_label ?? item.title}</strong>
                  {item.service_label ? <span> · {item.service_label}</span> : null}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.reassurance} aria-label="Ce qui est garanti">
        {reassurances.map((entry) => (
          <div key={entry.title} className={styles.reassuranceItem}>
            <h2 className={styles.reassuranceTitle}>{entry.title}</h2>
            <p className={styles.reassuranceBody}>{entry.body}</p>
          </div>
        ))}
      </section>

      {insuranceLabel ? <p className={styles.insurance}>{insuranceLabel}</p> : null}
    </header>
  );
}
