'use client';

import { Button } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';
import { consent as consentContent, formLabels, successMessages } from '@/content/forms';
import { contactSchema } from '@/lib/validation';
import {
  Consent,
  FormActions,
  HoneypotField,
  RequiredNote,
  TextArea,
  TextInput,
} from './Controls';
import { Field } from './Field';
import { FieldRow, Fieldset } from './Fieldset';
import { ErrorSummary, SuccessPanel } from './FormShell';
import { useFormSubmission } from './useFormSubmission';
import styles from './form.module.css';

const ID = 'contact';

const initialValues = {
  fullName: '',
  email: '',
  company: '',
  message: '',
  consent: false,
  fax: '',
};

const fieldOrder = ['fullName', 'email', 'company', 'message', 'consent'] as const;

const labels: Record<string, string> = {
  fullName: 'Prénom et nom',
  email: 'Adresse e-mail',
  company: 'Entreprise',
  message: 'Votre message',
  consent: 'Consentement',
};

/**
 * Formulaire de contact.
 *
 * Même socle que le diagnostic : validation partagée avec le serveur, saisies
 * conservées, focus sur la première erreur, état d'envoi, double envoi
 * impossible, champ piège et temps minimal.
 */
export function ContactForm({ className }: { readonly className?: string | undefined }) {
  const { values, setValue, errors, formError, state, submit, summaryRef } =
    useFormSubmission({
      endpoint: '/api/contact',
      schema: contactSchema,
      initialValues,
      fieldOrder: [...fieldOrder],
      idPrefix: ID,
    });

  if (state === 'success') {
    return (
      <SuccessPanel
        title={successMessages.contact.title}
        summary={[{ label: 'Réponse attendue à', value: values.email }]}
      >
        {successMessages.contact.body}
      </SuccessPanel>
    );
  }

  return (
    <form className={[styles.form, className].filter(Boolean).join(' ')} onSubmit={submit} noValidate>
      <ErrorSummary
        errors={errors}
        formError={formError}
        summaryRef={summaryRef}
        labels={labels}
      />

      <Fieldset legend="Votre projet">
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

          <Field id={`${ID}-email`} label={labels.email ?? ''} error={errors.email}>
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

        <Field
          id={`${ID}-company`}
          label={labels.company ?? ''}
          optional
          error={errors.company}
        >
          <TextInput
            id={`${ID}-company`}
            name="company"
            value={values.company}
            onChange={(value) => setValue('company', value)}
            autoComplete="organization"
            error={errors.company}
          />
        </Field>

        <Field id={`${ID}-message`} label={labels.message ?? ''} error={errors.message}>
          <TextArea
            id={`${ID}-message`}
            name="message"
            rows={6}
            placeholder="Votre contexte, vos objectifs et ce qui vous freine aujourd’hui…"
            value={values.message}
            onChange={(value) => setValue('message', value)}
            error={errors.message}
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
          {formLabels.contactSubmit}
        </Button>
        <RequiredNote />
      </FormActions>
    </form>
  );
}
