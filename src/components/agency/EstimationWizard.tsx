'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import {
  estimationDisclaimer,
  offerById,
  type Offer,
} from '@/content/estimation-offers';
import { questions, recommend, type Answers, type Question } from '@/lib/estimation';

import styles from './EstimationWizard.module.css';

/**
 * Le parcours d'estimation.
 *
 * **Une question par écran, et c'est le choix structurant.** L'ancien
 * configurateur montrait trois questions et une grille d'options sur le même
 * écran, avec un prix qui changeait en direct. Sur un téléphone — d'où vient
 * l'essentiel du trafic de cette page — cela donnait un mur d'éléments
 * cliquables dont le résultat défilait hors de vue. Une question à la fois
 * demande plus de clics mais moins d'attention à chaque instant, ce qui est
 * le bon arbitrage pour quelqu'un qui répond entre deux véhicules.
 *
 * **Le résultat vient avant la demande de coordonnées.** L'étape de contact
 * est la dernière, et elle arrive après huit questions déjà investies : c'est
 * le moment où la demande est la moins coûteuse. Le prospect voit d'abord sa
 * recommandation, puis choisit d'être recontacté — l'inverse (un mur avant le
 * résultat) transforme la page en formulaire de capture, ce qu'elle n'est pas.
 *
 * **L'animation est une transition d'opacité et rien d'autre.** Un glissement
 * horizontal donnerait le mal de mer sur neuf écrans consécutifs, et
 * `prefers-reduced-motion` la supprime — géré en CSS, pas en JavaScript, parce
 * qu'ici aucune règle `!important` héritée ne s'y oppose.
 *
 * **Le champ piège et le chronomètre ne sont pas décoratifs.** Ils sont
 * attendus par `handleSubmission`, qui refuse les envois trop rapides et ceux
 * qui remplissent le champ caché. Retirer l'un des deux ferait passer toutes
 * les soumissions pour des robots.
 */

type ContactFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  area: string;
};

const EMPTY_CONTACT: ContactFields = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  businessName: '',
  area: '',
};

/** Étapes du parcours : les questions, puis le résultat, puis le contact. */
const TOTAL_STEPS = questions.length + 1;

function formatPrice(offer: Offer): string {
  if (offer.monthly !== null) return `${offer.monthly} € par mois`;
  if (offer.oneOff) {
    return offer.oneOff.from
      ? `à partir de ${offer.oneOff.amount} €`
      : `${offer.oneOff.amount} €`;
  }
  return 'sur devis';
}

export function EstimationWizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [freeText, setFreeText] = useState('');
  const [contact, setContact] = useState<ContactFields>(EMPTY_CONTACT);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  /* Horodatage d'ouverture : `handleSubmission` refuse les envois trop rapides
     pour être humains.

     Rempli dans un effet et non à l'initialisation de la ref : `Date.now()`
     appelé pendant le rendu est impur — il donnerait une valeur différente à
     chaque rendu du serveur et du client, et le lint du projet le refuse à
     juste titre. L'effet s'exécute une fois, après le montage, ce qui est
     précisément le moment où le visiteur commence à répondre. */
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const isResultStep = step === questions.length;
  const recommendation = useMemo(() => recommend(answers), [answers]);
  const offer = offerById[recommendation.offerId];
  const companion = recommendation.companionOfferId
    ? offerById[recommendation.companionOfferId]
    : null;

  const question: Question | undefined = questions[step];
  const picked = question ? (answers[question.id] ?? []) : [];
  const canContinue = !question || !question.required || picked.length > 0;

  /* Le focus suit l'étape. Sans cela, un utilisateur au clavier ou au lecteur
     d'écran reste sur le bouton « Continuer » pendant que le contenu change
     au-dessus de lui, sans rien entendre. */
  const goTo = (next: number) => {
    setStep(next);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  };

  const toggle = (questionId: Question['id'], choiceId: string, multiple: boolean) => {
    setAnswers((current) => {
      const existing = current[questionId] ?? [];
      if (!multiple) return { ...current, [questionId]: [choiceId] };
      return {
        ...current,
        [questionId]: existing.includes(choiceId)
          ? existing.filter((id) => id !== choiceId)
          : [...existing, choiceId],
      };
    });
  };

  /** Réponses mises en forme lisible — c'est cette version qui part par e-mail. */
  const readableAnswers = useMemo(
    () =>
      questions
        .map((q) => {
          const chosen = (answers[q.id] ?? [])
            .map((id) => q.choices.find((c) => c.id === id)?.label ?? id)
            .join(', ');
          const suffix = q.freeTextFor && (answers[q.id] ?? []).includes(q.freeTextFor) && freeText
            ? ` (${freeText})`
            : '';
          return chosen ? `${q.title} → ${chosen}${suffix}` : null;
        })
        .filter(Boolean)
        .join('\n'),
    [answers, freeText],
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === 'sending') return;

    setStatus('sending');
    setErrorMessage('');

    try {
      const response = await fetch('/api/estimation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contact,
          recommendation: offer.name,
          answers: readableAnswers,
          consent,
          // Champ piège : un robot le remplit, un humain ne le voit pas.
          fax: '',
          elapsedMs: Date.now() - startedAt.current,
          pageUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message =
          body && typeof body === 'object' && 'message' in body
            ? String((body as { message: unknown }).message)
            : 'L’envoi n’a pas abouti. Réessayez dans un instant.';
        setErrorMessage(message);
        setStatus('error');
        return;
      }

      setStatus('sent');
    } catch {
      setErrorMessage('L’envoi n’a pas abouti. Vérifiez votre connexion et réessayez.');
      setStatus('error');
    }
  };

  /* ---------------------------------------------------------------- */

  return (
    <div className={styles.wizard}>
      {/* En-tête de progression. `aria-valuenow` porte l'information pour les
          lecteurs d'écran ; la barre visuelle est purement décorative. */}
      <div className={styles.progressHead}>
        <p className={styles.stepCount}>
          Étape {Math.min(step + 1, TOTAL_STEPS)} sur {TOTAL_STEPS}
        </p>
        {step > 0 ? (
          <button type="button" className={styles.back} onClick={() => goTo(step - 1)}>
            Retour
          </button>
        ) : null}
      </div>

      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={Math.min(step + 1, TOTAL_STEPS)}
        aria-label="Progression de l’estimation"
      >
        <span
          className={styles.progressFill}
          style={{ inlineSize: `${((Math.min(step + 1, TOTAL_STEPS)) / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className={styles.stage} key={step}>
        {question ? (
          <>
            {/* `text-[...]` n'est pas décoratif : c'est ce qui rend au titre la
                maîtrise de sa taille. `tailwind.css` impose
                `[data-theme='dark'] h2:not([class*='text-'])` à 2,6 rem, et
                cette règle battait le `clamp` du module — le titre sortait à
                42 px au lieu de 28, tenait sur trois lignes, et poussait le
                bouton « Continuer » sous le pli. L'exclusion `[class*='text-']`
                est le mécanisme prévu par cette règle pour laisser un
                composant décider ; encore fallait-il l'utiliser. */}
            <h2
              className={`${styles.question} text-[clamp(1.35rem,3.5vw,1.75rem)]`}
              tabIndex={-1}
              ref={headingRef}
            >
              {question.title}
            </h2>
            {question.help ? <p className={styles.help}>{question.help}</p> : null}

            <div className={styles.choices} role={question.multiple ? 'group' : 'radiogroup'}>
              {question.choices.map((choice) => {
                const selected = picked.includes(choice.id);
                return (
                  <button
                    key={choice.id}
                    type="button"
                    className={`${styles.choice} ${selected ? styles.choiceSelected : ''}`}
                    aria-pressed={selected}
                    onClick={() => toggle(question.id, choice.id, question.multiple)}
                  >
                    <span className={styles.choiceMark} aria-hidden="true" />
                    <span>
                      <span className={styles.choiceLabel}>{choice.label}</span>
                      {choice.hint ? (
                        <span className={styles.choiceHint}>{choice.hint}</span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>

            {question.freeTextFor && picked.includes(question.freeTextFor) ? (
              <label className={styles.freeText}>
                <span>Précisez votre activité</span>
                <input
                  type="text"
                  value={freeText}
                  onChange={(event) => setFreeText(event.target.value)}
                  maxLength={120}
                  placeholder="Par exemple : nettoyage de poids lourds"
                />
              </label>
            ) : null}

            {/* Barre collante plutôt qu'un bouton en fin de flux. Avec sept
                options, le bouton tombait hors de l'écran sur un portable comme
                sur un ordinateur : il fallait deviner qu'il existait puis
                défiler pour l'atteindre, à chacune des huit étapes. Collé en
                bas, il est toujours là — c'est la convention des formulaires
                en plusieurs étapes, et elle vaut ici plus qu'ailleurs. */}
            <div className={`${styles.actions} ${styles.actionsSticky}`}>
              <button
                type="button"
                className={styles.primary}
                disabled={!canContinue}
                onClick={() => goTo(step + 1)}
              >
                {step === questions.length - 1 ? 'Voir ma recommandation' : 'Continuer'}
              </button>
              {!canContinue ? (
                <p className={styles.hint}>Choisissez au moins une réponse pour continuer.</p>
              ) : null}
            </div>
          </>
        ) : null}

        {isResultStep ? (
          <>
            <p className={styles.eyebrow}>Votre recommandation</p>
            <h2
              className={`${styles.question} text-[clamp(1.35rem,3.5vw,1.75rem)]`}
              tabIndex={-1}
              ref={headingRef}
            >
              {offer.name}
            </h2>

            <p className={styles.rationale}>{recommendation.rationale}</p>

            <div className={styles.offerCard}>
              <p className={styles.price}>{formatPrice(offer)}</p>
              <p className={styles.audience}>{offer.audience}</p>

              <p className={styles.listTitle}>Ce qui est inclus</p>
              <ul className={styles.included}>
                {offer.included.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              {/* Dire ce qui manque est ce qui distingue une estimation d'une
                  page de vente. Une liste uniquement positive prépare la
                  déception à la première facture. */}
              <p className={styles.listTitle}>Ce qui n’est pas inclus</p>
              <ul className={styles.excluded}>
                {offer.excluded.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            {companion ? (
              <div className={styles.companion}>
                <p className={styles.companionTitle}>À envisager en plus</p>
                <p>
                  <strong>{companion.name}</strong> — {formatPrice(companion)}. Prestation de
                  création facturée une fois, distincte de l’abonnement.
                </p>
              </div>
            ) : null}

            <p className={styles.disclaimer}>{estimationDisclaimer}</p>

            {status === 'sent' ? (
              <div className={styles.sent} role="status">
                <p className={styles.sentTitle}>Votre demande est partie.</p>
                <p>
                  Nous revenons vers vous à l’adresse indiquée. Vous pouvez fermer cette page,
                  votre estimation vous a été envoyée.
                </p>
                <Link href={offer.action.href} className={styles.secondaryLink}>
                  {offer.action.label}
                </Link>
              </div>
            ) : (
              <form className={styles.contact} onSubmit={submit} noValidate>
                <h3 className={styles.contactTitle}>Recevoir cette estimation</h3>
                <p className={styles.contactLead}>
                  Nous vous l’envoyons par e-mail et restons disponibles pour la préciser.
                </p>

                <div className={styles.fields}>
                  <label>
                    <span>Prénom</span>
                    <input
                      required
                      autoComplete="given-name"
                      value={contact.firstName}
                      onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
                    />
                  </label>
                  <label>
                    <span>Nom ou entreprise</span>
                    <input
                      required
                      autoComplete="family-name"
                      value={contact.lastName}
                      onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
                    />
                  </label>
                  <label>
                    <span>Adresse e-mail</span>
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    />
                  </label>
                  <label>
                    <span>
                      Téléphone <em>facultatif</em>
                    </span>
                    <input
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    />
                  </label>
                  <label>
                    <span>
                      Nom de l’activité <em>facultatif</em>
                    </span>
                    <input
                      autoComplete="organization"
                      value={contact.businessName}
                      onChange={(e) => setContact({ ...contact, businessName: e.target.value })}
                    />
                  </label>
                  <label>
                    <span>Ville ou zone d’intervention</span>
                    <input
                      required
                      value={contact.area}
                      onChange={(e) => setContact({ ...contact, area: e.target.value })}
                    />
                  </label>
                </div>

                {/* Champ piège. `aria-hidden` et `tabIndex` le retirent des
                    parcours clavier et lecteur d'écran ; seul un robot qui
                    remplit tout le formulaire le renseigne. */}
                <div className={styles.trap} aria-hidden="true">
                  <label>
                    Ne pas remplir
                    <input type="text" name="fax" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                <label className={styles.consent}>
                  <input
                    type="checkbox"
                    required
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    J’accepte d’être recontacté au sujet de cette estimation. Vos coordonnées ne
                    servent qu’à cela — voir la{' '}
                    <Link href="/politique-de-confidentialite">politique de confidentialité</Link>.
                  </span>
                </label>

                {status === 'error' ? (
                  <p className={styles.error} role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                <div className={styles.actions}>
                  <button type="submit" className={styles.primary} disabled={status === 'sending'}>
                    {status === 'sending' ? 'Envoi…' : 'Envoyer ma demande'}
                  </button>
                  <Link href={offer.action.href} className={styles.secondaryLink}>
                    {offer.action.label}
                  </Link>
                </div>
              </form>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
