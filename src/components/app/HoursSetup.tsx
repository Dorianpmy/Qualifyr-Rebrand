'use client';

import { useEffect, useState } from 'react';
import styles from '@/app/app/app.module.css';

/**
 * Horaires d'ouverture hebdomadaires, configurés par le professionnel.
 *
 * Référence : docs/19-horaires-ouverture.md. Avant cet écran, la table
 * `detailer_availability` — déjà lue par le moteur de créneaux
 * (`src/lib/detailing/availability.ts`) pour construire les cases d'heures que
 * voit le client sur sa page de réservation — ne pouvait être remplie que par
 * une requête SQL manuelle. Aucun professionnel ne pouvait donc renseigner ses
 * horaires lui-même, et sans ligne pour un jour, ce jour n'affiche jamais le
 * moindre créneau côté client (`availability.ts:47-48`).
 *
 * Même architecture que `PaymentSetup.tsx` (docs/18) : chargement au montage,
 * édition locale (« draft ») distincte de ce qui est enregistré, un bouton
 * « Enregistrer » explicite plutôt qu'un enregistrement à chaque frappe.
 */

const WEEKDAY_LABELS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
] as const;

/** Ordre d'affichage français (lundi d'abord) → `weekday` de la base (0 = dimanche, comme `Date#getDay()`). */
const DISPLAY_TO_WEEKDAY = [1, 2, 3, 4, 5, 6, 0];

type Day = {
  readonly weekday: number;
  open: boolean;
  opensAt: string;
  closesAt: string;
};

type State =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly days: readonly Day[]; readonly bufferMinutes: number }
  | { readonly phase: 'error'; readonly message: string };

const DEFAULT_OPENS = '08:00';
const DEFAULT_CLOSES = '18:00';

export function HoursSetup() {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [draftDays, setDraftDays] = useState<readonly Day[] | null>(null);
  const [draftBuffer, setDraftBuffer] = useState(15);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;

    void fetch('/api/app/availability')
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data: {
            days?: readonly {
              weekday: number;
              open: boolean;
              opensAt: string | null;
              closesAt: string | null;
            }[];
            bufferMinutes?: number;
          } | null,
        ) => {
          if (!active) return;

          const byWeekday = new Map((data?.days ?? []).map((d) => [d.weekday, d]));
          const days: readonly Day[] = DISPLAY_TO_WEEKDAY.map((weekday) => {
            const row = byWeekday.get(weekday);
            return {
              weekday,
              open: row?.open ?? false,
              opensAt: row?.opensAt ?? DEFAULT_OPENS,
              closesAt: row?.closesAt ?? DEFAULT_CLOSES,
            };
          });

          setState({ phase: 'ready', days, bufferMinutes: data?.bufferMinutes ?? 15 });
          setDraftDays(days);
          setDraftBuffer(data?.bufferMinutes ?? 15);
        },
      )
      .catch(() => {
        if (active) setState({ phase: 'error', message: 'Chargement impossible.' });
      });

    return () => {
      active = false;
    };
  }, []);

  function updateDay(weekday: number, patch: Partial<Day>) {
    setDraftDays((current) =>
      (current ?? []).map((day) => (day.weekday === weekday ? { ...day, ...patch } : day)),
    );
    setSaved(false);
  }

  async function save() {
    if (!draftDays) return;

    for (const day of draftDays) {
      if (day.open && day.opensAt >= day.closesAt) {
        const label = WEEKDAY_LABELS[DISPLAY_TO_WEEKDAY.indexOf(day.weekday)];
        setSaveError(`${label} : l’heure de fin doit être après l’heure de début.`);
        return;
      }
    }

    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const response = await fetch('/api/app/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bufferMinutes: draftBuffer,
          days: draftDays.map((day) => ({
            weekday: day.weekday,
            open: day.open,
            ...(day.open ? { opensAt: day.opensAt, closesAt: day.closesAt } : {}),
          })),
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setSaveError(data.error ?? 'Enregistrement impossible.');
        return;
      }

      setState({ phase: 'ready', days: draftDays, bufferMinutes: draftBuffer });
      setSaved(true);
    } catch {
      setSaveError('Erreur réseau. Réessayez.');
    } finally {
      setSaving(false);
    }
  }

  if (state.phase === 'loading' || !draftDays) {
    return (
      <section className={`${styles.panel} ${styles.paymentPanel}`} aria-labelledby="hours-title">
        <h2 id="hours-title" className={styles.paymentTitle}>
          Vos horaires d’ouverture
        </h2>
        <p className={styles.paymentNote}>Vérification…</p>
      </section>
    );
  }

  if (state.phase === 'error') {
    return (
      <section className={`${styles.panel} ${styles.paymentPanel}`} aria-labelledby="hours-title">
        <h2 id="hours-title" className={styles.paymentTitle}>
          Vos horaires d’ouverture
        </h2>
        <p className={styles.paymentError} role="alert">
          {state.message}
        </p>
      </section>
    );
  }

  const noOpenDay = draftDays.every((day) => !day.open);

  return (
    <section className={`${styles.panel} ${styles.paymentPanel}`} aria-labelledby="hours-title">
      <div className={styles.paymentHead}>
        <div>
          <h2 id="hours-title" className={styles.paymentTitle}>
            Vos horaires d’ouverture
          </h2>
          <p className={styles.paymentLede}>
            Vos clients ne voient un créneau que dans ces plages horaires.
          </p>
        </div>
      </div>

      <div className={styles.hoursGrid}>
        {draftDays.map((day) => {
          const label = WEEKDAY_LABELS[DISPLAY_TO_WEEKDAY.indexOf(day.weekday)];
          return (
            <div key={day.weekday} className={styles.hoursRow}>
              <label className={styles.hoursDayToggle}>
                <input
                  type="checkbox"
                  checked={day.open}
                  onChange={(event) => updateDay(day.weekday, { open: event.target.checked })}
                />
                <span>{label}</span>
              </label>

              {day.open ? (
                <div className={styles.hoursTimes}>
                  <input
                    type="time"
                    value={day.opensAt}
                    aria-label={`Heure de début, ${label}`}
                    onChange={(event) => updateDay(day.weekday, { opensAt: event.target.value })}
                  />
                  <span aria-hidden="true">–</span>
                  <input
                    type="time"
                    value={day.closesAt}
                    aria-label={`Heure de fin, ${label}`}
                    onChange={(event) => updateDay(day.weekday, { closesAt: event.target.value })}
                  />
                </div>
              ) : (
                <span className={styles.hoursClosedLabel}>Fermé</span>
              )}
            </div>
          );
        })}
      </div>

      <label className={styles.hoursBufferRow}>
        <span>Battement entre deux prestations (minutes)</span>
        <input
          type="number"
          min={0}
          max={240}
          step={5}
          value={draftBuffer}
          onChange={(event) => {
            setDraftBuffer(Number(event.target.value) || 0);
            setSaved(false);
          }}
        />
      </label>

      {noOpenDay ? (
        <p className={styles.manualWarning}>
          Aucun jour ouvert : vos clients ne pourront réserver aucun créneau.
        </p>
      ) : null}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className={`app-primary ${styles.btnPrimary} ${styles.paymentCta}`}
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>

      {saveError ? (
        <p role="alert" className={styles.paymentError}>
          {saveError}
        </p>
      ) : null}
      {saved ? <p className={styles.paymentNote}>Enregistré.</p> : null}
    </section>
  );
}
