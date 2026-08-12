'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { agencyChannels } from '@/content/agency-channels';
import {
  activityOptions,
  budgetStatusOptions,
  conciergeTypeOptions,
  consent as consentContent,
  demandSourceOptions,
  labelFor,
  practiceModeOptions,
  preferredContactOptions,
  priorityOptions,
  siteSituationOptions,
  timingOptions,
} from '@/content/forms';
import { BookingButton } from '@/components/agency/BookingButton';
import {
  diagnosticSchema,
  diagnosticStepSchemas,
} from '@/lib/validation';
import {
  buildDiagnosticWhatsAppMessage,
  buildWhatsAppUrl,
} from '@/lib/whatsapp';
import { Button, ButtonAnchor, ButtonLink } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';
import { trackEvent } from '@/lib/analytics';
import {
  ChoiceGroup,
  Consent,
  FieldError,
  HoneypotField,
  TextArea,
  TextInput,
} from './Controls';
import { Field } from './Field';
import { ErrorSummary } from './FormShell';
import { useFormSubmission } from './useFormSubmission';
import styles from './form.module.css';

const ID = 'diagnostic';
const STORAGE_KEY = 'qualifyr-diagnostic-session';

const initialValues = {
  activity: '',
  activityDetails: '',
  practiceMode: '',
  conciergeType: '',
  company: '',
  website: '',
  siteSituation: '',
  demandSources: [] as string[],
  situationNote: '',
  priorities: [] as string[],
  desiredResult: '',
  timing: '',
  budgetStatus: '',
  budgetAmount: '',
  constraints: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  preferredContact: '',
  consent: false,
  fax: '',
};

const fieldOrder = [
  'activity',
  'activityDetails',
  'practiceMode',
  'conciergeType',
  'company',
  'website',
  'siteSituation',
  'demandSources',
  'situationNote',
  'priorities',
  'desiredResult',
  'timing',
  'budgetStatus',
  'budgetAmount',
  'constraints',
  'firstName',
  'lastName',
  'email',
  'phone',
  'preferredContact',
  'consent',
] as const;

const labels: Record<string, string> = {
  activity: 'Votre activité',
  activityDetails: 'Précisions sur votre activité',
  practiceMode: 'Mode de prestation',
  conciergeType: 'Type de conciergerie',
  company: 'Nom de l’entreprise',
  website: 'Adresse de votre site actuel',
  siteSituation: 'Situation actuelle du site',
  demandSources: 'Origine des demandes',
  situationNote: 'Ce qui vous gêne le plus',
  priorities: 'Priorités',
  desiredResult: 'Résultat souhaité',
  timing: 'Démarrage souhaité',
  budgetStatus: 'Enveloppe définie',
  budgetAmount: 'Montant ou fourchette',
  constraints: 'Contraintes ou attentes',
  firstName: 'Prénom',
  lastName: 'Nom',
  email: 'E-mail',
  phone: 'Téléphone ou numéro WhatsApp',
  preferredContact: 'Moyen de contact préféré',
  consent: 'Consentement',
};

const steps = [
  {
    title: 'Votre activité',
    question: 'Parlez-nous de votre activité.',
    context: 'Nous adapterons la suite du parcours à votre situation.',
  },
  {
    title: 'Votre situation',
    question: 'Où en êtes-vous aujourd’hui ?',
    context: 'Nous cherchons à comprendre comment les demandes arrivent et ce qui manque de fluidité.',
  },
  {
    title: 'Vos priorités',
    question: 'Qu’est-ce qui doit changer en priorité ?',
    context: 'Deux choix suffisent pour faire apparaître l’essentiel sans transformer la demande en cahier des charges.',
  },
  {
    title: 'Votre projet',
    question: 'Comment imaginez-vous la suite ?',
    context: 'Le moment, votre réflexion budgétaire et les contraintes connues nous aident à préparer un échange utile.',
  },
  {
    title: 'Vos coordonnées',
    question: 'Comment pouvons-nous vous répondre ?',
    context: 'Ces informations servent uniquement à reprendre votre demande avec vous.',
  },
] as const;

type Phase = 'intro' | 'steps' | 'review' | 'complete';

function Question({
  legend,
  hint,
  optional = false,
  children,
}: {
  legend: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className={styles.diagnosticQuestion}>
      <legend>
        {legend}
        {optional ? <span>facultatif</span> : null}
      </legend>
      {hint ? <p className={styles.questionHint}>{hint}</p> : null}
      {children}
    </fieldset>
  );
}

function ReviewSection({
  title,
  step,
  children,
  onEdit,
}: {
  title: string;
  step: number;
  children: ReactNode;
  onEdit: (step: number) => void;
}) {
  return (
    <section className={styles.reviewSection} aria-labelledby={`review-${step}`}>
      <div className={styles.reviewHeading}>
        <h2 id={`review-${step}`}>{title}</h2>
        <button type="button" onClick={() => onEdit(step)}>
          Modifier<span className={styles.srOnly}> {title.toLowerCase()}</span>
        </button>
      </div>
      <dl>{children}</dl>
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

type DiagnosticActivity = 'nettoyage-detailing' | 'conciergerie';

export function DiagnosticForm({ initialActivity }: { initialActivity?: DiagnosticActivity | undefined }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentStep, setCurrentStep] = useState(0);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const submittedEventSent = useRef(false);
  const formInitialValues = useMemo(
    () => ({ ...initialValues, activity: initialActivity ?? '' }),
    [initialActivity],
  );

  const {
    values,
    setValue,
    errors,
    formError,
    state,
    submit,
    summaryRef,
    validate,
    hasSavedValues,
    resumePersisted,
    discardPersisted,
  } = useFormSubmission({
    endpoint: '/api/diagnostic',
    schema: diagnosticSchema,
    initialValues: formInitialValues,
    fieldOrder: [...fieldOrder],
    idPrefix: ID,
    storageKey: STORAGE_KEY,
    promptBeforeRestore: true,
  });

  useEffect(() => {
    if (state !== 'success') return;
    if (!submittedEventSent.current) {
      trackEvent('diagnostic_submitted', { pagePath: '/diagnostic' });
      submittedEventSent.current = true;
    }
    const timer = window.setTimeout(() => setPhase('complete'), 0);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (phase === 'intro') return;
    const timer = window.setTimeout(() => {
      headingRef.current?.focus({ preventScroll: true });
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [currentStep, phase]);

  const activeStep = steps[currentStep] ?? steps[0];
  const progress = (currentStep + 1) * 20;
  const firstStepReady = Boolean(
    values.activity &&
      values.company.trim().length >= 2 &&
      (values.activity !== 'autre-service' || values.activityDetails.trim().length >= 3),
  );

  const toggleLimited = (
    field: 'demandSources' | 'priorities',
    value: string,
    maximum: number,
    message: string,
  ) => {
    const selected = values[field];
    if (selected.includes(value)) {
      setValue(field, selected.filter((item) => item !== value));
      setSelectionNotice(null);
      return;
    }
    if (selected.length >= maximum) {
      setSelectionNotice(message);
      return;
    }
    setValue(field, [...selected, value]);
    setSelectionNotice(null);
  };

  const goToStep = (step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, steps.length - 1)));
    setSelectionNotice(null);
    setPhase('steps');
  };

  const goNext = () => {
    const schema = diagnosticStepSchemas[currentStep];
    if (!schema || !validate(schema)) return;
    trackEvent('diagnostic_step_completed', {
      pagePath: '/diagnostic',
      stepNumber: currentStep + 1,
      vertical: values.activity || undefined,
    });
    if (currentStep === steps.length - 1) {
      trackEvent('diagnostic_reviewed', {
        pagePath: '/diagnostic',
        vertical: values.activity || undefined,
      });
      setPhase('review');
      return;
    }
    goToStep(currentStep + 1);
  };

  const listLabels = (options: Parameters<typeof labelFor>[0], selected: readonly string[]) =>
    selected.map((value) => labelFor(options, value)).join(', ');

  const activityPrecision =
    values.activity === 'nettoyage-detailing'
      ? labelFor(practiceModeOptions, values.practiceMode)
      : values.activity === 'conciergerie'
        ? labelFor(conciergeTypeOptions, values.conciergeType)
        : values.activityDetails;

  const whatsappMessage = useMemo(
    () =>
      buildDiagnosticWhatsAppMessage({
        activity: labelFor(activityOptions, values.activity),
        activityDetails: activityPrecision,
        company: values.company,
        website: values.website,
        siteSituation: labelFor(siteSituationOptions, values.siteSituation),
        demandSources: values.demandSources.map((value) => labelFor(demandSourceOptions, value)),
        situationNote: values.situationNote,
        priorities: values.priorities.map((value) => labelFor(priorityOptions, value)),
        desiredResult: values.desiredResult,
        timing: labelFor(timingOptions, values.timing),
        budget: [
          labelFor(budgetStatusOptions, values.budgetStatus),
          values.budgetAmount,
        ]
          .filter(Boolean)
          .join(' — '),
        constraints: values.constraints,
        firstName: values.firstName,
        preferredContact: labelFor(preferredContactOptions, values.preferredContact),
      }),
    [activityPrecision, values],
  );
  const whatsappUrl = buildWhatsAppUrl(agencyChannels.whatsappNumber, whatsappMessage);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (phase === 'review') {
      void submit(event);
      return;
    }
    event.preventDefault();
    if (phase === 'steps') goNext();
  };

  const contextTitle =
    phase === 'intro'
      ? 'Une demande mieux préparée.'
      : phase === 'review'
        ? 'Relisez l’essentiel.'
        : phase === 'complete'
          ? 'La suite reste simple.'
          : activeStep.title;

  return (
    <form className={styles.diagnosticExperience} onSubmit={handleSubmit} noValidate>
      <aside className={styles.diagnosticContext} data-surface="inverse">
        <div className={styles.contextTop}>
          <span className={styles.contextNumber}>
            {phase === 'intro' ? 'Diagnostic Qualifyr' : phase === 'review' ? 'Votre demande' : phase === 'complete' ? 'Demande envoyée' : `0${currentStep + 1}`}
          </span>
          <p className={styles.contextTitle}>{contextTitle}</p>
          <p className={styles.contextCopy}>
            {phase === 'intro'
              ? 'Quelques réponses permettent de comprendre votre activité avant de parler de solution.'
              : phase === 'review'
                ? 'Chaque partie peut encore être modifiée avant l’envoi de votre demande.'
                : phase === 'complete'
                  ? 'Nous utiliserons ces éléments pour préparer un échange plus concret.'
                  : activeStep.context}
          </p>
        </div>

        {phase === 'steps' ? (
          <div className={styles.contextProgress}>
            <p>Étape {currentStep + 1} sur 5</p>
            <div className={styles.diagnosticProgress} aria-hidden="true">
              <span style={{ inlineSize: `${progress}%` }} />
            </div>
            <ol>
              {steps.map((step, index) => (
                <li key={step.title} data-state={index === currentStep ? 'current' : index < currentStep ? 'complete' : 'future'}>
                  <span>0{index + 1}</span>{step.title}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <span className={styles.contextMark} aria-hidden="true">Q</span>
      </aside>

      <div className={styles.diagnosticWorkspace}>
        <p className={styles.srOnly} aria-live="polite">
          {phase === 'steps' ? `Étape ${currentStep + 1} sur 5 : ${activeStep.title}` : ''}
        </p>

        {phase === 'intro' ? (
          <section className={styles.diagnosticIntro} aria-labelledby="diagnostic-intro-title">
            <p className={styles.diagnosticEyebrow}>Diagnostic Qualifyr</p>
            <h1 id="diagnostic-intro-title">Parlons de ce que votre activité doit mieux montrer.</h1>
            <p className={styles.diagnosticLead}>
              En quelques questions, nous allons comprendre votre situation, vos priorités et le meilleur point de départ pour notre échange.
            </p>
            <p className={styles.duration}>Environ 3 minutes</p>
            {hasSavedValues ? (
              <div className={styles.resumePanel} role="status">
                <p><strong>Nous avons retrouvé vos réponses.</strong></p>
                <p>Vous pouvez continuer ou repartir d’une demande vide.</p>
                <div className={styles.resumeActions}>
                  <Button type="button" onClick={() => { resumePersisted(); trackEvent('diagnostic_started', { pagePath: '/diagnostic' }); goToStep(0); }}>
                    Continuer
                  </Button>
                  <Button type="button" variant="text" onClick={discardPersisted}>
                    Recommencer
                  </Button>
                </div>
              </div>
            ) : null}
            <div className={styles.introActions}>
              <Button ctaId="hero_diagnostic" type="button" withArrow onClick={() => { if (hasSavedValues) discardPersisted(); trackEvent('diagnostic_started', { pagePath: '/diagnostic', vertical: initialActivity }); goToStep(0); }}>
                Commencer
              </Button>
              {agencyChannels.bookingUrl ? (
                <BookingButton ctaId="diagnostic_booking" variant="text">
                  Je préfère réserver un échange
                </BookingButton>
              ) : null}
            </div>
            <ul className={styles.reassuranceList}>
              <li>Réponses confidentielles</li>
              <li>Aucun engagement</li>
              <li>Vous pourrez tout vérifier avant l’envoi</li>
            </ul>
          </section>
        ) : null}

        {phase === 'steps' ? (
          <section className={styles.diagnosticStep} aria-labelledby="diagnostic-step-title">
            <div className={styles.mobileProgress}>
              <span>Étape {currentStep + 1} sur 5</span>
              <div className={styles.diagnosticProgress} aria-hidden="true">
                <span style={{ inlineSize: `${progress}%` }} />
              </div>
            </div>
            <p className={styles.diagnosticEyebrow}>{activeStep.title}</p>
            <h1 ref={headingRef} tabIndex={-1} id="diagnostic-step-title">
              {activeStep.question}
            </h1>
            <p className={styles.stepIntroduction}>{activeStep.context}</p>

            <ErrorSummary
              errors={errors}
              formError={formError}
              summaryRef={summaryRef}
              labels={labels}
              title="Vérifiez les champs indiqués"
            />

            <div className={styles.questionStack}>
              {currentStep === 0 ? (
                <>
                  <Question legend="Quelle activité dirigez-vous ?">
                    <ChoiceGroup
                      id={`${ID}-activity`}
                      name="activity"
                      type="radio"
                      options={activityOptions}
                      selected={values.activity ? [values.activity] : []}
                      onToggle={(value) => {
                        setValue('activity', value);
                        if (value !== 'autre-service') setValue('activityDetails', '');
                        if (value !== 'nettoyage-detailing') setValue('practiceMode', '');
                        if (value !== 'conciergerie') setValue('conciergeType', '');
                      }}
                      error={errors.activity}
                    />
                    {errors.activity ? <FieldError id={`${ID}-activity`}>{errors.activity}</FieldError> : null}
                  </Question>
                  {values.activity === 'autre-service' ? (
                    <Field id={`${ID}-activityDetails`} label="Précisez votre activité" error={errors.activityDetails}>
                      <TextInput
                        id={`${ID}-activityDetails`}
                        name="activityDetails"
                        value={values.activityDetails}
                        onChange={(value) => setValue('activityDetails', value)}
                        maxLength={300}
                        placeholder="Ex. entretien de logements, photographie…"
                        error={errors.activityDetails}
                      />
                    </Field>
                  ) : null}
                  {values.activity === 'nettoyage-detailing' ? (
                    <Question legend="Comment exercez-vous principalement ?" optional>
                      <ChoiceGroup id={`${ID}-practiceMode`} name="practiceMode" type="radio" options={practiceModeOptions} selected={values.practiceMode ? [values.practiceMode] : []} onToggle={(value) => setValue('practiceMode', value)} columns={2} error={errors.practiceMode} />
                      {errors.practiceMode ? <FieldError id={`${ID}-practiceMode`}>{errors.practiceMode}</FieldError> : null}
                    </Question>
                  ) : null}
                  {values.activity === 'conciergerie' ? (
                    <Question legend="Quel type de conciergerie développez-vous ?" optional>
                      <ChoiceGroup id={`${ID}-conciergeType`} name="conciergeType" type="radio" options={conciergeTypeOptions} selected={values.conciergeType ? [values.conciergeType] : []} onToggle={(value) => setValue('conciergeType', value)} columns={2} error={errors.conciergeType} />
                      {errors.conciergeType ? <FieldError id={`${ID}-conciergeType`}>{errors.conciergeType}</FieldError> : null}
                    </Question>
                  ) : null}
                  <Field id={`${ID}-company`} label="Nom de l’entreprise" error={errors.company}>
                    <TextInput id={`${ID}-company`} name="company" value={values.company} onChange={(value) => setValue('company', value)} autoComplete="organization" error={errors.company} />
                  </Field>
                  <Field id={`${ID}-website`} label="Votre site actuel" optional hint="Vous pouvez écrire exemple.fr, le protocole sera ajouté automatiquement." error={errors.website}>
                    <TextInput id={`${ID}-website`} name="website" type="url" inputMode="url" value={values.website} onChange={(value) => setValue('website', value)} placeholder="exemple.fr" hasHint error={errors.website} />
                  </Field>
                </>
              ) : null}

              {currentStep === 1 ? (
                <>
                  <Question legend="Quelle phrase décrit le mieux votre situation ?">
                    <ChoiceGroup id={`${ID}-siteSituation`} name="siteSituation" type="radio" options={siteSituationOptions} selected={values.siteSituation ? [values.siteSituation] : []} onToggle={(value) => setValue('siteSituation', value)} error={errors.siteSituation} />
                    {errors.siteSituation ? <FieldError id={`${ID}-siteSituation`}>{errors.siteSituation}</FieldError> : null}
                  </Question>
                  <Question legend="Comment vos prospects vous découvrent-ils aujourd’hui ?" hint="Choisissez jusqu’à trois réponses.">
                    <ChoiceGroup id={`${ID}-demandSources`} name="demandSources" type="checkbox" options={demandSourceOptions} selected={values.demandSources} onToggle={(value) => toggleLimited('demandSources', value, 3, 'Trois réponses suffisent pour identifier vos canaux principaux.')} columns={2} error={errors.demandSources} />
                    {errors.demandSources ? <FieldError id={`${ID}-demandSources`}>{errors.demandSources}</FieldError> : null}
                  </Question>
                  <Field id={`${ID}-situationNote`} label="Qu’est-ce qui vous frustre le plus dans votre fonctionnement actuel ?" optional error={errors.situationNote}>
                    <TextArea id={`${ID}-situationNote`} name="situationNote" rows={3} maxLength={400} value={values.situationNote} onChange={(value) => setValue('situationNote', value)} error={errors.situationNote} />
                    <span className={styles.counter}>{values.situationNote.length} / 400</span>
                  </Field>
                </>
              ) : null}

              {currentStep === 2 ? (
                <>
                  <Question legend="Choisissez jusqu’à deux priorités.">
                    <ChoiceGroup id={`${ID}-priorities`} name="priorities" type="checkbox" options={priorityOptions} selected={values.priorities} onToggle={(value) => toggleLimited('priorities', value, 2, 'Choisissez les deux priorités les plus importantes pour le moment.')} columns={2} error={errors.priorities} />
                    {errors.priorities ? <FieldError id={`${ID}-priorities`}>{errors.priorities}</FieldError> : null}
                  </Question>
                  <Field id={`${ID}-desiredResult`} label="Quel changement aimeriez-vous constater une fois le projet terminé ?" optional error={errors.desiredResult}>
                    <TextArea id={`${ID}-desiredResult`} name="desiredResult" rows={3} maxLength={400} value={values.desiredResult} onChange={(value) => setValue('desiredResult', value)} error={errors.desiredResult} />
                    <span className={styles.counter}>{values.desiredResult.length} / 400</span>
                  </Field>
                </>
              ) : null}

              {currentStep === 3 ? (
                <>
                  <Question legend="Quand souhaitez-vous commencer ?">
                    <ChoiceGroup id={`${ID}-timing`} name="timing" type="radio" options={timingOptions} selected={values.timing ? [values.timing] : []} onToggle={(value) => setValue('timing', value)} columns={2} error={errors.timing} />
                    {errors.timing ? <FieldError id={`${ID}-timing`}>{errors.timing}</FieldError> : null}
                  </Question>
                  <Question legend="Avez-vous déjà défini une enveloppe pour le projet ?">
                    <ChoiceGroup id={`${ID}-budgetStatus`} name="budgetStatus" type="radio" options={budgetStatusOptions} selected={values.budgetStatus ? [values.budgetStatus] : []} onToggle={(value) => {
                      setValue('budgetStatus', value);
                      if (value !== 'oui') setValue('budgetAmount', '');
                    }} columns={2} error={errors.budgetStatus} />
                    {errors.budgetStatus ? <FieldError id={`${ID}-budgetStatus`}>{errors.budgetStatus}</FieldError> : null}
                  </Question>
                  {values.budgetStatus === 'oui' ? (
                    <Field id={`${ID}-budgetAmount`} label="Montant ou fourchette envisagée" optional error={errors.budgetAmount}>
                      <TextInput id={`${ID}-budgetAmount`} name="budgetAmount" value={values.budgetAmount} onChange={(value) => setValue('budgetAmount', value)} maxLength={120} error={errors.budgetAmount} />
                    </Field>
                  ) : null}
                  <Field id={`${ID}-constraints`} label="Y a-t-il une contrainte, une échéance ou une idée importante à connaître ?" optional error={errors.constraints}>
                    <TextArea id={`${ID}-constraints`} name="constraints" rows={4} maxLength={700} value={values.constraints} onChange={(value) => setValue('constraints', value)} error={errors.constraints} />
                    <span className={styles.counter}>{values.constraints.length} / 700</span>
                  </Field>
                </>
              ) : null}

              {currentStep === 4 ? (
                <>
                  <div className={styles.compactFields}>
                    <Field id={`${ID}-firstName`} label="Prénom" error={errors.firstName}>
                      <TextInput id={`${ID}-firstName`} name="firstName" value={values.firstName} onChange={(value) => setValue('firstName', value)} autoComplete="given-name" error={errors.firstName} />
                    </Field>
                    <Field id={`${ID}-lastName`} label="Nom" optional error={errors.lastName}>
                      <TextInput id={`${ID}-lastName`} name="lastName" value={values.lastName} onChange={(value) => setValue('lastName', value)} autoComplete="family-name" error={errors.lastName} />
                    </Field>
                  </div>
                  <div className={styles.compactFields}>
                    <Field id={`${ID}-email`} label="E-mail professionnel" error={errors.email}>
                      <TextInput id={`${ID}-email`} name="email" type="email" inputMode="email" value={values.email} onChange={(value) => setValue('email', value)} autoComplete="email" error={errors.email} />
                    </Field>
                    <Field id={`${ID}-phone`} label="Téléphone ou numéro WhatsApp" optional error={errors.phone}>
                      <TextInput id={`${ID}-phone`} name="phone" type="tel" inputMode="tel" value={values.phone} onChange={(value) => setValue('phone', value)} autoComplete="tel" error={errors.phone} />
                    </Field>
                  </div>
                  <Question legend="Quel moyen de contact préférez-vous ?">
                    <ChoiceGroup id={`${ID}-preferredContact`} name="preferredContact" type="radio" options={preferredContactOptions} selected={values.preferredContact ? [values.preferredContact] : []} onToggle={(value) => setValue('preferredContact', value)} columns={2} error={errors.preferredContact} />
                    {errors.preferredContact ? <FieldError id={`${ID}-preferredContact`}>{errors.preferredContact}</FieldError> : null}
                  </Question>
                  <Consent id={`${ID}-consent`} name="consent" checked={values.consent} onChange={(checked) => setValue('consent', checked)} error={errors.consent}>
                    {consentContent.before}<TextLink href="/politique-de-confidentialite">{consentContent.linkLabel}</TextLink>{consentContent.after}
                  </Consent>
                </>
              ) : null}
            </div>

            {selectionNotice ? <p className={styles.selectionNotice} role="status">{selectionNotice}</p> : null}

            <div className={styles.diagnosticActions}>
              {currentStep > 0 ? <Button type="button" variant="secondary" onClick={() => goToStep(currentStep - 1)}>Précédent</Button> : <span />}
              <Button type="button" withArrow onClick={goNext} disabled={currentStep === 0 && !firstStepReady}>
                {currentStep === 4 ? 'Vérifier ma demande' : 'Continuer'}
              </Button>
            </div>
          </section>
        ) : null}

        {phase === 'review' ? (
          <section className={styles.diagnosticReview} aria-labelledby="diagnostic-review-title">
            <p className={styles.diagnosticEyebrow}>Votre demande</p>
            <h1 ref={headingRef} tabIndex={-1} id="diagnostic-review-title">Vérifiez votre projet avant de l’envoyer.</h1>
            <p className={styles.stepIntroduction}>Ce résumé ne constitue pas un résultat automatique. Il sert à préparer notre échange.</p>

            <ErrorSummary errors={errors} formError={formError} summaryRef={summaryRef} labels={labels} title="Votre demande n’a pas pu être envoyée" />

            <div className={styles.reviewGrid}>
              <ReviewSection title="Activité" step={0} onEdit={goToStep}>
                <ReviewRow label="Entreprise" value={values.company} />
                <ReviewRow label="Activité" value={labelFor(activityOptions, values.activity)} />
                <ReviewRow label="Précision" value={activityPrecision} />
                <ReviewRow label="Site" value={values.website} />
              </ReviewSection>
              <ReviewSection title="Situation actuelle" step={1} onEdit={goToStep}>
                <ReviewRow label="Site" value={labelFor(siteSituationOptions, values.siteSituation)} />
                <ReviewRow label="Demandes" value={listLabels(demandSourceOptions, values.demandSources)} />
                <ReviewRow label="Ressenti" value={values.situationNote} />
              </ReviewSection>
              <ReviewSection title="Priorités" step={2} onEdit={goToStep}>
                <ReviewRow label="Priorités" value={listLabels(priorityOptions, values.priorities)} />
                <ReviewRow label="Résultat souhaité" value={values.desiredResult} />
              </ReviewSection>
              <ReviewSection title="Projet" step={3} onEdit={goToStep}>
                <ReviewRow label="Démarrage" value={labelFor(timingOptions, values.timing)} />
                <ReviewRow label="Budget" value={`${labelFor(budgetStatusOptions, values.budgetStatus)}${values.budgetAmount ? ` — ${values.budgetAmount}` : ''}`} />
                <ReviewRow label="Précisions" value={values.constraints} />
              </ReviewSection>
              <ReviewSection title="Coordonnées" step={4} onEdit={goToStep}>
                <ReviewRow label="Nom" value={[values.firstName, values.lastName].filter(Boolean).join(' ')} />
                <ReviewRow label="E-mail" value={values.email} />
                <ReviewRow label="Téléphone" value={values.phone} />
                <ReviewRow label="Contact préféré" value={labelFor(preferredContactOptions, values.preferredContact)} />
              </ReviewSection>
            </div>

            <HoneypotField value={values.fax} onChange={(value) => setValue('fax', value)} />
            <div className={styles.reviewActions}>
              <Button type="submit" loading={state === 'submitting'} withArrow>
                Envoyer ma demande
              </Button>
              <Button type="button" variant="text" onClick={() => goToStep(4)}>Retour</Button>
            </div>
            <p className={styles.reviewNote}>Vous pourrez ensuite continuer sur WhatsApp ou réserver un échange.</p>
            {formError && whatsappUrl ? (
              <div className={styles.fallbackBox} role="status">
                <p>Votre demande n’a pas été transmise par le formulaire. Vos réponses sont conservées.</p>
                <ButtonAnchor href={whatsappUrl} target="_blank" variant="secondary" ctaId="diagnostic_whatsapp_fallback" analyticsEvent="diagnostic_whatsapp_opened" analyticsDestination="whatsapp">
                  Transmettre le résumé sur WhatsApp
                </ButtonAnchor>
              </div>
            ) : null}
          </section>
        ) : null}

        {phase === 'complete' ? (
          <section className={styles.diagnosticComplete} aria-labelledby="diagnostic-complete-title">
            <p className={styles.diagnosticEyebrow}>Demande envoyée</p>
            <h1 ref={headingRef} tabIndex={-1} id="diagnostic-complete-title">Merci, votre projet est maintenant plus clair.</h1>
            <p className={styles.diagnosticLead}>
              Nous utiliserons ces informations pour préparer un échange plus concret avec vous.
            </p>
            <ol className={styles.nextSteps}>
              <li><span>01</span>Nous lisons votre demande.</li>
              <li><span>02</span>Nous préparons les premiers points à aborder.</li>
              <li><span>03</span>Nous échangeons sur la solution la plus adaptée.</li>
            </ol>
            <div className={styles.introActions}>
              {whatsappUrl ? (
                <ButtonAnchor href={whatsappUrl} target="_blank" withArrow ctaId="diagnostic_whatsapp_complete" analyticsEvent="diagnostic_whatsapp_opened" analyticsDestination="whatsapp">Continuer sur WhatsApp</ButtonAnchor>
              ) : null}
              {agencyChannels.bookingUrl ? <BookingButton ctaId="diagnostic_booking_complete" variant="secondary">Réserver une analyse de parcours</BookingButton> : null}
              <ButtonLink href="/" variant="secondary">Retour à l’accueil</ButtonLink>
            </div>
            <p className={styles.legalLinks}>
              <TextLink href="/politique-de-confidentialite">Politique de confidentialité</TextLink>
              <span aria-hidden="true">·</span>
              <TextLink href="/mentions-legales">Mentions légales</TextLink>
            </p>
          </section>
        ) : null}
      </div>
    </form>
  );
}
