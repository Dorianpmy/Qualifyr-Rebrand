'use client';

import { useEffect, useState } from 'react';
import styles from '@/app/app/app.module.css';

/**
 * Activation du paiement en ligne, côté professionnel.
 *
 * Référence : docs/18-options-paiement-acompte.md. Deux modes, choisis par un
 * sélecteur en tête du module :
 *
 * - **Stripe** — inchangé depuis la version précédente de ce composant :
 *   « le detailer n'achète pas une intégration Stripe, il achète le fait
 *   d'être payé ». Le nom du prestataire n'apparaît qu'en note de bas de
 *   module.
 * - **Manuel** — le professionnel indique lui-même comment il veut être payé
 *   (virement ou lien PayPal personnel) et confirme la réception à la main,
 *   depuis le détail de chaque réservation. Aucune intégration, aucun
 *   webhook : voir `deposit-confirm/route.ts`.
 *
 * **Changer de mode ne casse rien.** Le choix n'affecte que les nouvelles
 * réservations — celles déjà engagées gardent le mode sous lequel elles ont
 * été prises (lu directement sur la réservation par `checkout/route.ts` et
 * `booking-public.ts`, pas déduit après coup).
 */

type Mode = 'stripe' | 'manuel';
type ManualMethod = 'virement' | 'paypal_lien';

type StripeState =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly connected: boolean; readonly chargesEnabled: boolean }
  | { readonly phase: 'error'; readonly message: string };

type SettingsState =
  | { readonly phase: 'loading' }
  | {
      readonly phase: 'ready';
      readonly mode: Mode;
      readonly manualMethod: ManualMethod | null;
      readonly iban: string;
      readonly paypalLink: string;
    }
  | { readonly phase: 'error'; readonly message: string };

export function PaymentSetup() {
  const [settings, setSettings] = useState<SettingsState>({ phase: 'loading' });
  const [stripe, setStripe] = useState<StripeState>({ phase: 'loading' });
  const [opening, setOpening] = useState(false);

  // Édition locale du mode manuel — distincte de `settings`, qui reflète ce
  // qui est enregistré : le professionnel doit pouvoir changer de méthode et
  // remplir ses champs avant d'enregistrer, sans que chaque frappe touche la
  // base.
  const [draftMethod, setDraftMethod] = useState<ManualMethod | null>(null);
  const [draftIban, setDraftIban] = useState('');
  const [draftPaypalLink, setDraftPaypalLink] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;

    void Promise.all([
      fetch('/api/app/payment-settings').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/app/stripe-connect').then((r) => (r.ok ? r.json() : null)),
    ]).then(
      ([settingsData, stripeData]: [
        {
          paymentMode?: string;
          manualMethod?: string | null;
          iban?: string | null;
          paypalLink?: string | null;
        } | null,
        { connected?: boolean; chargesEnabled?: boolean } | null,
      ]) => {
        if (!active) return;

        const mode: Mode = settingsData?.paymentMode === 'manuel' ? 'manuel' : 'stripe';
        const manualMethod =
          settingsData?.manualMethod === 'virement' || settingsData?.manualMethod === 'paypal_lien'
            ? settingsData.manualMethod
            : null;

        setSettings({
          phase: 'ready',
          mode,
          manualMethod,
          iban: settingsData?.iban ?? '',
          paypalLink: settingsData?.paypalLink ?? '',
        });
        setDraftMethod(manualMethod);
        setDraftIban(settingsData?.iban ?? '');
        setDraftPaypalLink(settingsData?.paypalLink ?? '');
        setAcknowledged(mode === 'manuel' && manualMethod !== null);

        setStripe({
          phase: 'ready',
          connected: Boolean(stripeData?.connected),
          chargesEnabled: Boolean(stripeData?.chargesEnabled),
        });
      },
    );

    return () => {
      active = false;
    };
  }, []);

  async function openStripe() {
    setOpening(true);
    try {
      const response = await fetch('/api/app/stripe-connect', { method: 'POST' });
      const data = (await response.json()) as { url?: string; error?: string };

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setStripe({ phase: 'error', message: data.error ?? 'Ouverture impossible.' });
    } catch {
      setStripe({ phase: 'error', message: 'Ouverture impossible.' });
    } finally {
      setOpening(false);
    }
  }

  /** Bascule immédiate vers Stripe — aucun champ à remplir avant. */
  async function selectStripe() {
    if (settings.phase !== 'ready') return;
    setSettings({ ...settings, mode: 'stripe' });
    await fetch('/api/app/payment-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMode: 'stripe' }),
    });
  }

  /** Bascule locale vers le manuel — l'enregistrement attend que le
      professionnel choisisse un moyen et coche la case de reconnaissance. */
  function selectManual() {
    if (settings.phase !== 'ready') return;
    setSettings({ ...settings, mode: 'manuel' });
  }

  async function saveManual() {
    if (!draftMethod) {
      setSaveError('Choisissez un moyen : virement bancaire ou lien PayPal.');
      return;
    }
    if (!acknowledged) {
      setSaveError('Cochez la case pour confirmer que vous avez compris.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const response = await fetch('/api/app/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMode: 'manuel',
          manualMethod: draftMethod,
          iban: draftMethod === 'virement' ? draftIban : undefined,
          paypalLink: draftMethod === 'paypal_lien' ? draftPaypalLink : undefined,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setSaveError(data.error ?? 'Enregistrement impossible.');
        return;
      }

      setSettings({
        phase: 'ready',
        mode: 'manuel',
        manualMethod: draftMethod,
        iban: draftMethod === 'virement' ? draftIban : '',
        paypalLink: draftMethod === 'paypal_lien' ? draftPaypalLink : '',
      });
      setSaved(true);
    } catch {
      setSaveError('Erreur réseau. Réessayez.');
    } finally {
      setSaving(false);
    }
  }

  if (settings.phase === 'loading' || stripe.phase === 'loading') {
    return (
      <section className={`${styles.panel} ${styles.paymentPanel}`} aria-labelledby="payment-title">
        <h2 id="payment-title" className={styles.paymentTitle}>
          Être payé en ligne
        </h2>
        <p className={styles.paymentNote}>Vérification…</p>
      </section>
    );
  }

  const mode = settings.phase === 'ready' ? settings.mode : 'stripe';
  const stripeActive = stripe.phase === 'ready' && stripe.chargesEnabled;
  const stripeStarted = stripe.phase === 'ready' && stripe.connected && !stripe.chargesEnabled;
  const manualConfigured =
    settings.phase === 'ready' && settings.manualMethod !== null && settings.mode === 'manuel';

  return (
    <section className={`${styles.panel} ${styles.paymentPanel}`} aria-labelledby="payment-title">
      <div className={styles.paymentHead}>
        <div>
          <h2 id="payment-title" className={styles.paymentTitle}>
            Être payé en ligne
          </h2>
          <p className={styles.paymentLede}>
            Choisissez comment vous voulez recevoir l’acompte de vos clients.
          </p>
        </div>

        <span
          className={
            (mode === 'stripe' && stripeActive) || manualConfigured
              ? `${styles.badge} ${styles.badgeConfirme}`
              : `${styles.badge} ${styles.badgeAttente}`
          }
        >
          {mode === 'stripe'
            ? stripeActive
              ? 'Actif'
              : stripeStarted
                ? 'Dossier à terminer'
                : 'Non activé'
            : manualConfigured
              ? 'Actif'
              : 'À configurer'}
        </span>
      </div>

      {/* Sélecteur — mêmes classes que la bascule Se connecter / Créer un
          compte de l'écran de connexion, pour un seul vocabulaire visuel de
          contrôle segmenté dans tout le dashboard. */}
      <div className={styles.modeSwitch} role="tablist" aria-label="Mode d’encaissement">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'stripe'}
          className={mode === 'stripe' ? `${styles.modeTab} ${styles.modeTabActive}` : styles.modeTab}
          onClick={selectStripe}
        >
          Carte bancaire (automatique)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'manuel'}
          className={mode === 'manuel' ? `${styles.modeTab} ${styles.modeTabActive}` : styles.modeTab}
          onClick={selectManual}
        >
          Je gère la réception moi-même
        </button>
      </div>

      {mode === 'stripe' ? (
        stripeActive ? (
          <p className={styles.paymentNote}>
            Les acomptes sont encaissés. Vos virements arrivent selon le rythme choisi lors de
            l’inscription.
          </p>
        ) : (
          <>
            <ul className={styles.paymentList}>
              <li>Votre pièce d’identité</li>
              <li>Votre IBAN, pour recevoir l’argent</li>
              <li>Votre numéro SIRET, ou l’équivalent suisse</li>
            </ul>

            <p className={styles.paymentNote}>
              Comptez cinq minutes. Tant que ce n’est pas fait, vos clients réservent normalement
              mais règlent la totalité sur place — vous perdez la garantie de l’acompte.
            </p>

            <button
              type="button"
              onClick={openStripe}
              disabled={opening}
              className={`app-primary ${styles.btnPrimary} ${styles.paymentCta}`}
            >
              {opening ? 'Ouverture…' : stripeStarted ? 'Terminer mon dossier' : 'Activer les paiements'}
            </button>

            {stripe.phase === 'error' ? (
              <p role="alert" className={styles.paymentError}>
                {stripe.message}
              </p>
            ) : null}
          </>
        )
      ) : (
        <div className={styles.manualBlock}>
          <div className={styles.modeSwitch} role="radiogroup" aria-label="Moyen de réception">
            <button
              type="button"
              role="radio"
              aria-checked={draftMethod === 'virement'}
              className={
                draftMethod === 'virement' ? `${styles.modeTab} ${styles.modeTabActive}` : styles.modeTab
              }
              onClick={() => {
                setDraftMethod('virement');
                setSaved(false);
              }}
            >
              Virement bancaire
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={draftMethod === 'paypal_lien'}
              className={
                draftMethod === 'paypal_lien'
                  ? `${styles.modeTab} ${styles.modeTabActive}`
                  : styles.modeTab
              }
              onClick={() => {
                setDraftMethod('paypal_lien');
                setSaved(false);
              }}
            >
              Lien PayPal
            </button>
          </div>

          {draftMethod === 'virement' ? (
            <label>
              <span>IBAN</span>
              <input
                value={draftIban}
                onChange={(e) => {
                  setDraftIban(e.target.value);
                  setSaved(false);
                }}
                placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                maxLength={50}
              />
            </label>
          ) : draftMethod === 'paypal_lien' ? (
            <label>
              <span>Votre lien PayPal</span>
              <input
                type="url"
                value={draftPaypalLink}
                onChange={(e) => {
                  setDraftPaypalLink(e.target.value);
                  setSaved(false);
                }}
                placeholder="https://paypal.me/votre-nom"
                maxLength={300}
              />
              <small>
                Uniquement un lien paypal.me ou paypal.com — un autre lien sera refusé à
                l’enregistrement.
              </small>
            </label>
          ) : null}

          {draftMethod ? (
            <>
              {/* Avertissement non masquable par un simple clic (docs/18 §0.2) :
                  ce mode retire la garantie anti-désistement que l'acompte
                  Stripe apporte. */}
              <p className={styles.manualWarning}>
                Vous choisissez vous-même quand l’acompte est marqué reçu. Qualifyr ne peut pas
                vérifier qu’il a réellement été envoyé, ni garantir la réservation contre une
                annulation de dernière minute.
              </p>

              <label className={styles.manualConsent}>
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                />
                <span>J’ai compris et je confirme moi-même la réception de chaque acompte.</span>
              </label>

              <button
                type="button"
                onClick={saveManual}
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
            </>
          ) : null}
        </div>
      )}

      <p className={styles.paymentFootnote}>
        {mode === 'stripe'
          ? 'Les paiements sont traités par Stripe, agréé établissement de paiement en Europe. Vos coordonnées bancaires ne transitent jamais par Qualifyr.'
          : 'Qualifyr ne traite ni ne voit jamais l’argent de l’acompte dans ce mode.'}
      </p>
    </section>
  );
}
