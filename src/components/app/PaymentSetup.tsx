'use client';

import { useEffect, useState } from 'react';
import styles from '@/app/app/app.module.css';

/**
 * Activation du paiement en ligne, côté professionnel.
 *
 * **Le mot « Stripe » n'apparaît qu'une fois, en bas.** Le detailer n'achète
 * pas une intégration Stripe, il achète le fait d'être payé. Mettre le nom du
 * prestataire en titre transforme une formalité de cinq minutes en décision
 * technique — et une décision technique, on la remet à plus tard.
 *
 * **On annonce ce qui va être demandé avant de rediriger.** Une pièce
 * d'identité et un IBAN réclamés sans prévenir, sur un formulaire d'un autre
 * domaine, font abandonner. Annoncés à l'avance, ils passent pour normaux —
 * parce qu'ils le sont.
 *
 * **L'état est relu au retour du formulaire.** Attendre le webhook
 * `account.updated` afficherait un écran inchangé à quelqu'un qui vient de
 * tout remplir, et il recommencerait.
 */

type State =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly connected: boolean; readonly chargesEnabled: boolean }
  | { readonly phase: 'error'; readonly message: string };

export function PaymentSetup() {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let active = true;

    void fetch('/api/app/stripe-connect')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { connected?: boolean; chargesEnabled?: boolean } | null) => {
        if (!active) return;
        setState({
          phase: 'ready',
          connected: Boolean(data?.connected),
          chargesEnabled: Boolean(data?.chargesEnabled),
        });
      })
      .catch(() => {
        if (active) setState({ phase: 'error', message: 'État du compte indisponible.' });
      });

    return () => {
      active = false;
    };
  }, []);

  async function open() {
    setOpening(true);
    try {
      const response = await fetch('/api/app/stripe-connect', { method: 'POST' });
      const data = (await response.json()) as { url?: string; error?: string };

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setState({ phase: 'error', message: data.error ?? 'Ouverture impossible.' });
    } catch {
      setState({ phase: 'error', message: 'Ouverture impossible.' });
    } finally {
      setOpening(false);
    }
  }

  const active = state.phase === 'ready' && state.chargesEnabled;
  const started = state.phase === 'ready' && state.connected && !state.chargesEnabled;

  return (
    <section className={`${styles.panel} ${styles.paymentPanel}`} aria-labelledby="payment-title">
      <div className={styles.paymentHead}>
        <div>
          <h2 id="payment-title" className={styles.paymentTitle}>
            Être payé en ligne
          </h2>
          <p className={styles.paymentLede}>
            L’acompte part directement sur votre compte bancaire, au moment où le client réserve.
            Qualifyr ne touche jamais cet argent et ne prélève aucune commission dessus.
          </p>
        </div>

        <span
          className={
            active
              ? `${styles.badge} ${styles.badgeConfirme}`
              : `${styles.badge} ${styles.badgeAttente}`
          }
        >
          {state.phase === 'loading'
            ? 'Vérification…'
            : active
              ? 'Actif'
              : started
                ? 'Dossier à terminer'
                : 'Non activé'}
        </span>
      </div>

      {active ? (
        <p className={styles.paymentNote}>
          Les acomptes sont encaissés. Vos virements arrivent selon le rythme choisi lors de
          l’inscription.
        </p>
      ) : (
        <>
          {/* Ce qui sera demandé, annoncé avant le clic. */}
          <ul className={styles.paymentList}>
            <li>Votre pièce d’identité</li>
            <li>Votre IBAN, pour recevoir l’argent</li>
            <li>Votre numéro SIRET, ou l’équivalent suisse</li>
          </ul>

          <p className={styles.paymentNote}>
            Comptez cinq minutes. Tant que ce n’est pas fait, vos clients réservent normalement mais
            règlent la totalité sur place — vous perdez la garantie de l’acompte.
          </p>

          <button
            type="button"
            onClick={open}
            disabled={opening || state.phase === 'loading'}
            className={`${styles.btnPrimary} ${styles.paymentCta}`}
          >
            {opening
              ? 'Ouverture…'
              : started
                ? 'Terminer mon dossier'
                : 'Activer les paiements'}
          </button>
        </>
      )}

      {state.phase === 'error' ? (
        <p role="alert" className={styles.paymentError}>
          {state.message}
        </p>
      ) : null}

      <p className={styles.paymentFootnote}>
        Les paiements sont traités par Stripe, agréé établissement de paiement en Europe. Vos
        coordonnées bancaires ne transitent jamais par Qualifyr.
      </p>
    </section>
  );
}
