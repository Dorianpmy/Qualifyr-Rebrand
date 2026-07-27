'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { agencyChannels } from '@/content/agency-channels';
import { buildWhatsAppMessage, type ProspectRequest } from '@/lib/whatsapp';
import { BookingButton } from './BookingButton';
import { Button, ButtonAnchor, ButtonLink } from '@/components/ui/Button';
import styles from './WhatsAppDiagnostic.module.css';

export const whatsappDiagnosticEvent = 'qualifyr:open-whatsapp-diagnostic';

type TriggerProps = {
  children?: string;
  variant?: 'primary' | 'secondary' | 'text' | 'inverse' | 'inverseSecondary';
  className?: string;
  withArrow?: boolean;
  onClick?: () => void;
};

export function WhatsAppDiagnosticButton({
  children = 'Faire le diagnostic WhatsApp',
  onClick,
  ...props
}: TriggerProps) {
  if (agencyChannels.whatsappNumber) {
    const message = 'Bonjour, je souhaite discuter de mon projet avec Qualifyr.';
    const href = `https://wa.me/${agencyChannels.whatsappNumber}?text=${encodeURIComponent(message)}`;

    return (
      <ButtonAnchor href={href} target="_blank" onClick={onClick} {...props}>
        {children}
      </ButtonAnchor>
    );
  }

  return (
    <Button
      {...props}
      onClick={() => {
        onClick?.();
        window.dispatchEvent(new Event(whatsappDiagnosticEvent));
      }}
    >
      {children}
    </Button>
  );
}

const activityOptions = [
  'Nettoyage automobile mobile',
  'Detailing à domicile',
  'Conciergerie',
  'Autre activité',
] as const;
const situationOptions = [
  'Je démarre mon activité',
  'Mon activité existe sans site',
  'J’ai déjà un site à améliorer',
] as const;
const needOptions = [
  'Clarifier mon offre',
  'Créer ou refaire mon site',
  'Mieux qualifier mes demandes',
  'Simplifier la prise de contact',
] as const;
const timingOptions = ['Dès que possible', 'Dans les trois prochains mois', 'Plus tard'] as const;

const initialRequest: ProspectRequest = {
  activity: '',
  situation: '',
  need: '',
  objective: '',
  timing: '',
  firstName: '',
  company: '',
  website: '',
  detail: '',
};

export function WhatsAppDiagnostic() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [step, setStep] = useState(0);
  const [request, setRequest] = useState<ProspectRequest>(initialRequest);
  const [error, setError] = useState('');

  useEffect(() => {
    const open = () => {
      setStep(0);
      setError('');
      document.body.style.overflow = 'hidden';
      dialogRef.current?.showModal();
    };
    window.addEventListener(whatsappDiagnosticEvent, open);
    return () => window.removeEventListener(whatsappDiagnosticEvent, open);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      document.body.style.overflow = '';
    };
    const onCancel = () => onClose();
    dialog.addEventListener('close', onClose);
    dialog.addEventListener('cancel', onCancel);
    return () => {
      dialog.removeEventListener('close', onClose);
      dialog.removeEventListener('cancel', onCancel);
    };
  }, []);

  const message = buildWhatsAppMessage(request);
  const whatsappUrl = agencyChannels.whatsappNumber
    ? `https://wa.me/${agencyChannels.whatsappNumber}?text=${encodeURIComponent(message)}`
    : null;

  const requiredValue = [
    request.activity,
    request.situation,
    request.need,
    request.objective,
    request.timing,
    request.firstName && request.company,
  ][step];

  function next() {
    if (!requiredValue?.trim()) {
      setError('Complétez cette étape avant de continuer.');
      return;
    }
    setError('');
    setStep((current) => Math.min(current + 1, 6));
  }

  function choose(field: keyof ProspectRequest, value: string) {
    setRequest((current) => ({ ...current, [field]: value }));
    setError('');
  }

  const optionStep = (
    legend: string,
    field: 'activity' | 'situation' | 'need' | 'timing',
    options: readonly string[],
  ) => (
    <fieldset className={styles.fieldset}>
      <legend>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label className={styles.option} key={option}>
            <input
              type="radio"
              name={field}
              value={option}
              checked={request[field] === option}
              onChange={() => choose(field, option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Diagnostic commercial Qualifyr</p>
            <h2 id={titleId}>Parlez-nous de votre projet.</h2>
          </div>
          <button
            className={styles.close}
            type="button"
            aria-label="Fermer le diagnostic"
            onClick={() => dialogRef.current?.close()}
          >
            ×
          </button>
        </header>

        <p className={styles.intro}>
          Ce court parcours qualifie votre demande avant un échange avec l’agence.
        </p>
        <p className={styles.progress}>Étape {Math.min(step + 1, 6)} sur 6</p>

        <div className={styles.content}>
          {step === 0 ? optionStep('Quelle est votre activité ?', 'activity', activityOptions) : null}
          {step === 1
            ? optionStep('Quelle est votre situation actuelle ?', 'situation', situationOptions)
            : null}
          {step === 2 ? optionStep('Quel est votre besoin principal ?', 'need', needOptions) : null}
          {step === 3 ? (
            <label className={styles.field}>
              <span>Quel objectif souhaitez-vous atteindre ?</span>
              <textarea
                rows={4}
                value={request.objective}
                onChange={(event) => choose('objective', event.target.value)}
                placeholder="Décrivez-le en quelques mots."
              />
            </label>
          ) : null}
          {step === 4
            ? optionStep('Quand souhaitez-vous démarrer ?', 'timing', timingOptions)
            : null}
          {step === 5 ? (
            <div className={styles.fields}>
              <label className={styles.field}>
                <span>Prénom *</span>
                <input
                  value={request.firstName}
                  onChange={(event) => choose('firstName', event.target.value)}
                  autoComplete="given-name"
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Entreprise *</span>
                <input
                  value={request.company}
                  onChange={(event) => choose('company', event.target.value)}
                  autoComplete="organization"
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Site actuel (facultatif)</span>
                <input
                  type="url"
                  value={request.website}
                  onChange={(event) => choose('website', event.target.value)}
                  placeholder="https://"
                />
              </label>
              <label className={styles.field}>
                <span>Une précision utile (facultatif)</span>
                <textarea
                  rows={3}
                  value={request.detail}
                  onChange={(event) => choose('detail', event.target.value)}
                />
              </label>
            </div>
          ) : null}
          {step === 6 ? (
            <div className={styles.summary}>
              <h3>Votre demande est prête.</h3>
              <pre>{message}</pre>
              {whatsappUrl ? (
                <ButtonAnchor href={whatsappUrl} target="_blank" withArrow>
                  Envoyer ma demande sur WhatsApp
                </ButtonAnchor>
              ) : (
                <div className={styles.fallback} role="status">
                  <p>
                    WhatsApp n’est pas encore configuré. Votre résumé reste visible et aucun
                    lien incomplet ne vous est proposé.
                  </p>
                  <div className={styles.actions}>
                    <BookingButton>Réserver un échange</BookingButton>
                    <ButtonLink href="/contact" variant="secondary">
                      Nous contacter
                    </ButtonLink>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {step < 6 ? (
          <footer className={styles.navigation}>
            {step > 0 ? (
              <Button variant="text" onClick={() => { setError(''); setStep(step - 1); }}>
                Retour
              </Button>
            ) : <span />}
            <Button onClick={next}>{step === 5 ? 'Préparer ma demande' : 'Continuer'}</Button>
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
