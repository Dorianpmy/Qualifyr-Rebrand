'use client';

import { Button } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';
import {
  activityOptions,
  bookingMethodOptions,
  consent as consentContent,
  formLabels,
  priorityOptions,
  seniorityOptions,
  successMessages,
} from '@/content/forms';
import { diagnosticSchema } from '@/lib/validation';
import {
  CheckboxGroup,
  Consent,
  FieldError,
  FormActions,
  HoneypotField,
  RequiredNote,
  Select,
  TextArea,
  TextInput,
} from './Controls';
import { Field } from './Field';
import { FieldRow, Fieldset } from './Fieldset';
import { ErrorSummary, SuccessPanel } from './FormShell';
import { useFormSubmission } from './useFormSubmission';
import styles from './form.module.css';

const ID = 'diagnostic';

const initialValues = {
  activity: '',
  activityDetails: '',
  fullName: '',
  company: '',
  email: '',
  phone: '',
  area: '',
  website: '',
  seniority: '',
  bookingMethods: [] as string[],
  priority: '',
  blocker: '',
  message: '',
  consent: false,
  fax: '',
};

/** Ordre de lecture du formulaire, utilisé pour cibler la première erreur. */
const fieldOrder = [
  'activity',
  'activityDetails',
  'company',
  'area',
  'seniority',
  'website',
  'bookingMethods',
  'priority',
  'blocker',
  'message',
  'fullName',
  'email',
  'phone',
  'consent',
] as const;

/** Libellés lisibles pour le résumé d'erreurs. */
const labels: Record<string, string> = {
  activity: 'Votre activité',
  activityDetails: 'Précisions sur votre activité',
  fullName: 'Prénom et nom',
  company: 'Nom de l’entreprise',
  email: 'Adresse e-mail',
  phone: 'Téléphone',
  area: 'Ville ou zone couverte',
  website: 'Site actuel',
  seniority: 'Ancienneté de l’activité',
  bookingMethods: 'Réservations reçues par',
  priority: 'Objectif prioritaire',
  blocker: 'Principal blocage',
  message: 'Message',
  consent: 'Consentement',
};

/**
 * Formulaire de diagnostic.
 *
 * Validation partagée avec le serveur (`diagnosticSchema`), saisies conservées
 * en cas d'erreur, focus porté sur le premier champ fautif, état d'envoi,
 * double envoi impossible, champ piège et temps minimal.
 *
 * En cas de succès, le formulaire est remplacé par une confirmation : pas de
 * redirection, pas de calendrier, aucun délai de réponse annoncé.
 */
export function DiagnosticForm() {
  const { values, setValue, errors, formError, state, submit, summaryRef } =
    useFormSubmission({
      endpoint: '/api/diagnostic',
      schema: diagnosticSchema,
      initialValues,
      fieldOrder: [...fieldOrder],
      idPrefix: ID,
    });

  if (state === 'success') {
    return (
      <SuccessPanel
        title={successMessages.diagnostic.title}
        summary={[
          { label: 'Entreprise', value: values.company },
          { label: 'Zone couverte', value: values.area },
          { label: 'Réponse attendue à', value: values.email },
        ]}
      >
        {successMessages.diagnostic.body}
      </SuccessPanel>
    );
  }

  const toggleMethod = (value: string) => {
    const next = values.bookingMethods.includes(value)
      ? values.bookingMethods.filter((item) => item !== value)
      : [...values.bookingMethods, value];
    setValue('bookingMethods', next);
  };

  const detailsContent =
    values.activity === 'conciergerie'
      ? {
          label: 'Votre type de conciergerie',
          hint: 'Précisez le type d’accompagnement, vos zones ou destinations et les demandes que vous recevez.',
        }
      : values.activity === 'nettoyage-auto-mobile' || values.activity === 'detailing-domicile'
        ? {
            label: 'Vos prestations automobiles',
            hint: 'Précisez les types de véhicules, votre zone d’intervention et vos prestations principales.',
          }
        : values.activity === 'autre'
          ? {
              label: 'Votre activité',
              hint: 'Décrivez-la brièvement. Ce choix ne signifie pas que Qualifyr acceptera automatiquement le projet.',
            }
          : null;

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <ErrorSummary
        errors={errors}
        formError={formError}
        summaryRef={summaryRef}
        labels={labels}
      />

      <Fieldset legend="Votre activité" number="01">
        <Field id={`${ID}-activity`} label={labels.activity ?? ''} error={errors.activity}>
          <Select
            id={`${ID}-activity`}
            name="activity"
            value={values.activity}
            onChange={(value) => {
              setValue('activity', value);
              setValue('activityDetails', '');
            }}
            options={activityOptions}
            error={errors.activity}
          />
        </Field>

        {detailsContent ? (
          <Field
            id={`${ID}-activityDetails`}
            label={detailsContent.label}
            hint={detailsContent.hint}
            optional
            error={errors.activityDetails}
          >
            <TextArea
              id={`${ID}-activityDetails`}
              name="activityDetails"
              rows={3}
              value={values.activityDetails}
              onChange={(value) => setValue('activityDetails', value)}
              hasHint
              error={errors.activityDetails}
            />
          </Field>
        ) : null}

        <FieldRow>
          <Field id={`${ID}-company`} label={labels.company ?? ''} error={errors.company}>
            <TextInput
              id={`${ID}-company`}
              name="company"
              value={values.company}
              onChange={(value) => setValue('company', value)}
              autoComplete="organization"
              error={errors.company}
            />
          </Field>
          <Field id={`${ID}-area`} label={labels.area ?? ''} error={errors.area}>
            <TextInput
              id={`${ID}-area`}
              name="area"
              value={values.area}
              onChange={(value) => setValue('area', value)}
              error={errors.area}
            />
          </Field>
        </FieldRow>

        <FieldRow>
          <Field
            id={`${ID}-seniority`}
            label={labels.seniority ?? ''}
            error={errors.seniority}
          >
            <Select
              id={`${ID}-seniority`}
              name="seniority"
              value={values.seniority}
              onChange={(value) => setValue('seniority', value)}
              options={seniorityOptions}
              error={errors.seniority}
            />
          </Field>
          <Field
            id={`${ID}-website`}
            label={labels.website ?? ''}
            hint="L’adresse de votre site, si vous en avez déjà un."
            optional
            error={errors.website}
          >
            <TextInput
              id={`${ID}-website`}
              name="website"
              type="url"
              inputMode="url"
              value={values.website}
              onChange={(value) => setValue('website', value)}
              hasHint
              error={errors.website}
            />
          </Field>
        </FieldRow>
      </Fieldset>

      <Fieldset legend="Votre situation" number="02">
        <fieldset className={styles.group}>
          <legend className={styles.groupLegend}>
            Comment recevez-vous vos réservations aujourd’hui ?
          </legend>
          <p className={styles.hint} id={`${ID}-bookingMethods-hint`}>
            Plusieurs réponses possibles.
          </p>
          <CheckboxGroup
            id={`${ID}-bookingMethods`}
            name="bookingMethods"
            options={bookingMethodOptions}
            selected={values.bookingMethods}
            onToggle={toggleMethod}
            columns={2}
          />
          {errors.bookingMethods ? (
            <FieldError id={`${ID}-bookingMethods`}>{errors.bookingMethods}</FieldError>
          ) : null}
        </fieldset>

        <Field id={`${ID}-priority`} label={labels.priority ?? ''} error={errors.priority}>
          <Select
            id={`${ID}-priority`}
            name="priority"
            value={values.priority}
            onChange={(value) => setValue('priority', value)}
            options={priorityOptions}
            error={errors.priority}
          />
        </Field>

        <Field
          id={`${ID}-blocker`}
          label={labels.blocker ?? ''}
          hint="En une ou deux phrases, ce qui vous freine le plus aujourd’hui."
          error={errors.blocker}
        >
          <TextArea
            id={`${ID}-blocker`}
            name="blocker"
            rows={3}
            value={values.blocker}
            onChange={(value) => setValue('blocker', value)}
            hasHint
            error={errors.blocker}
          />
        </Field>

        <Field
          id={`${ID}-message`}
          label="Autre chose à nous dire"
          optional
          error={errors.message}
        >
          <TextArea
            id={`${ID}-message`}
            name="message"
            rows={5}
            value={values.message}
            onChange={(value) => setValue('message', value)}
            error={errors.message}
          />
        </Field>
      </Fieldset>

      <Fieldset legend="Vos coordonnées" number="03">
        <FieldRow>
          <Field id={`${ID}-fullName`} label={labels.fullName ?? ''} error={errors.fullName}>
            <TextInput
              id={`${ID}-fullName`}
              name="fullName"
              value={values.fullName}
              onChange={(value) => setValue('fullName', value)}
              autoComplete="name"
              error={errors.fullName}
            />
          </Field>
          <Field
            id={`${ID}-email`}
            label="Adresse e-mail professionnelle"
            error={errors.email}
          >
            <TextInput
              id={`${ID}-email`}
              name="email"
              type="email"
              inputMode="email"
              value={values.email}
              onChange={(value) => setValue('email', value)}
              autoComplete="email"
              error={errors.email}
            />
          </Field>
        </FieldRow>

        <Field id={`${ID}-phone`} label={labels.phone ?? ''} optional error={errors.phone}>
          <TextInput
            id={`${ID}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            value={values.phone}
            onChange={(value) => setValue('phone', value)}
            autoComplete="tel"
            error={errors.phone}
          />
        </Field>

        <Consent
          id={`${ID}-consent`}
          name="consent"
          checked={values.consent}
          onChange={(checked) => setValue('consent', checked)}
          error={errors.consent}
        >
          {consentContent.before}
          <TextLink href="/politique-de-confidentialite">
            {consentContent.linkLabel}
          </TextLink>
          {consentContent.after}
        </Consent>
      </Fieldset>

      <HoneypotField value={values.fax} onChange={(value) => setValue('fax', value)} />

      <FormActions>
        <Button type="submit" loading={state === 'submitting'} withArrow>
          {formLabels.diagnosticSubmit}
        </Button>
        <RequiredNote />
      </FormActions>
    </form>
  );
}
