'use client';

import type { ReactNode } from 'react';
import type { SelectOption } from '@/content/forms';
import styles from './form.module.css';

/**
 * Contrôles de formulaire.
 *
 * Chaque contrôle est piloté par React (`value` + `onChange`) : les saisies
 * survivent à une erreur de validation, y compris serveur.
 *
 * En cas d'erreur, le contrôle porte `aria-invalid` **et** un
 * `aria-describedby` pointant sur le message. L'erreur n'est jamais véhiculée
 * par la seule couleur : un texte l'accompagne toujours.
 */

type Described = {
  readonly id: string;
  readonly hasHint?: boolean;
  readonly error?: string | undefined;
};

function describedBy({ id, hasHint, error }: Described) {
  const ids = [hasHint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length > 0 ? { 'aria-describedby': ids.join(' ') } : {};
}

function controlProps(props: Described) {
  return {
    className: props.error ? `${styles.control} ${styles.controlInvalid}` : styles.control,
    ...(props.error ? { 'aria-invalid': true as const } : {}),
    ...describedBy(props),
  };
}

/* ---------------------------------- Texte --------------------------------- */

export function TextInput({
  id,
  name,
  value,
  onChange,
  type = 'text',
  autoComplete,
  hasHint,
  error,
  inputMode,
  placeholder,
  maxLength,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'url';
  autoComplete?: string;
  hasHint?: boolean;
  error?: string | undefined;
  inputMode?: 'text' | 'email' | 'tel' | 'url';
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      {...(autoComplete ? { autoComplete } : {})}
      {...(inputMode ? { inputMode } : {})}
      {...(placeholder ? { placeholder } : {})}
      {...(maxLength ? { maxLength } : {})}
      {...controlProps({ id, hasHint: hasHint ?? false, error })}
    />
  );
}

export function TextArea({
  id,
  name,
  value,
  onChange,
  rows = 5,
  hasHint,
  error,
  placeholder,
  maxLength,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hasHint?: boolean;
  error?: string | undefined;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <textarea
      id={id}
      name={name}
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      {...(placeholder ? { placeholder } : {})}
      {...(maxLength ? { maxLength } : {})}
      {...controlProps({ id, hasHint: hasHint ?? false, error })}
    />
  );
}

/* ----------------------- Choix éditoriaux natifs ----------------------- */

export function ChoiceGroup({
  id,
  name,
  options,
  type,
  selected,
  onToggle,
  error,
  columns = 1,
}: {
  id: string;
  name: string;
  options: readonly SelectOption[];
  type: 'radio' | 'checkbox';
  selected: readonly string[];
  onToggle: (value: string) => void;
  error?: string | undefined;
  columns?: 1 | 2;
}) {
  return (
    <div
      id={id}
      className={`${styles.choiceGrid} ${columns === 2 ? styles.choiceGridTwo : ''}`}
      {...(error ? { 'aria-describedby': `${id}-error` } : {})}
    >
      {options.map((option, index) => {
        const checked = selected.includes(option.value);
        return (
          <label key={option.value} className={styles.choiceCard}>
            <input
              type={type}
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onToggle(option.value)}
              {...(error ? { 'aria-invalid': true as const } : {})}
            />
            <span className={styles.choiceIndex} aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className={styles.choiceCopy}>
              <strong>{option.label}</strong>
              {option.description ? <small>{option.description}</small> : null}
            </span>
            <span className={styles.choiceMark} aria-hidden="true" />
          </label>
        );
      })}
    </div>
  );
}

export function Select({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Choisir…',
  hasHint,
  error,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  hasHint?: boolean;
  error?: string | undefined;
}) {
  return (
    <span className={styles.selectWrap}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...controlProps({ id, hasHint: hasHint ?? false, error })}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </span>
  );
}

/* ------------------------------ Cases à cocher ----------------------------- */

export function CheckboxGroup({
  id,
  name,
  options,
  selected,
  onToggle,
  columns = 1,
}: {
  id: string;
  name: string;
  options: readonly SelectOption[];
  selected: readonly string[];
  onToggle: (value: string) => void;
  columns?: 1 | 2;
}) {
  const classes = [styles.options, columns === 2 ? styles.optionsTwo : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} id={id}>
      {options.map((option) => (
        <label key={option.value} className={styles.option}>
          <input
            className={styles.box}
            type="checkbox"
            name={name}
            value={option.value}
            checked={selected.includes(option.value)}
            onChange={() => onToggle(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

/* ------------------------------- Consentement ------------------------------ */

export function Consent({
  id,
  name,
  checked,
  onChange,
  error,
  children,
}: {
  id: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        className={error ? `${styles.consent} ${styles.consentInvalid}` : styles.consent}
        htmlFor={id}
      >
        <input
          className={styles.box}
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          {...(error ? { 'aria-invalid': true as const, 'aria-describedby': `${id}-error` } : {})}
        />
        <span>{children}</span>
      </label>
      {error ? <FieldError id={id}>{error}</FieldError> : null}
    </div>
  );
}

/* --------------------------------- Erreurs -------------------------------- */

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p className={styles.error} id={`${id}-error`}>
      <span className={styles.errorMark} aria-hidden="true" />
      {children}
    </p>
  );
}

/* ----------------------------- Champ piège -------------------------------- */

/**
 * Champ piège.
 *
 * Masqué visuellement, retiré du flux de tabulation et de l'arbre
 * d'accessibilité : jamais rencontré par un humain, y compris au lecteur
 * d'écran. Un robot qui remplit tous les champs le remplira.
 *
 * **Ce n'est pas une protection absolue** : c'est un filtre bon marché, qui
 * évite d'imposer un CAPTCHA au visiteur.
 */
export function HoneypotField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.honeypot} aria-hidden="true">
      <label htmlFor="fax">Numéro de fax</label>
      <input
        id="fax"
        name="fax"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}

/* ----------------------------- Divers ------------------------------------- */

export function FormActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}

export function RequiredNote() {
  return (
    <p className={styles.required}>
      Les champs sans mention « facultatif » sont nécessaires pour vous répondre.
    </p>
  );
}
