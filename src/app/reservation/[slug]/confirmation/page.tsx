import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PayDepositButton } from '@/components/detailing/PayDepositButton';
import { getPublicBookingSummary } from '@/lib/detailing/booking-public';

/**
 * Écran de paiement et de confirmation d'une réservation.
 *
 * **Cette page a deux entrées, un seul contenu.** Stripe y redirige après un
 * paiement réussi (`?booking=...`, ajouté par `successUrl` dans
 * `/api/detailing/checkout`) ; le même lien part aussi dans l'e-mail de
 * relance d'un devis abandonné. Dans les deux cas, la page relit le statut en
 * base plutôt que de faire confiance à l'origine de la visite — après un
 * paiement Stripe, le webhook a déjà pu passer la réservation à `confirme`
 * avant même que le navigateur revienne ici.
 */

export const dynamic = 'force-dynamic';

type ConfirmationPageProps = {
  readonly params: Promise<{ slug: string }>;
  readonly searchParams: Promise<{ booking?: string }>;
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const PAID_STATUSES = new Set(['confirme', 'ajuste', 'realise']);

export default async function ConfirmationPage({ params, searchParams }: ConfirmationPageProps) {
  const { slug } = await params;
  const { booking: bookingId } = await searchParams;

  if (!bookingId) notFound();

  const summary = await getPublicBookingSummary(bookingId, slug);
  if (!summary) notFound();

  const paid = PAID_STATUSES.has(summary.status);
  const cancelled = summary.status === 'annule' || summary.status === 'expire';

  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
      }}
    >
      <div style={{ maxWidth: '30rem', width: '100%', textAlign: 'center' }}>
        {paid ? (
          <>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.75rem' }}>
              Réservation confirmée
            </p>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>
              C’est réglé — {summary.detailerName} vous attend.
            </h1>
            <p style={{ fontSize: '1rem', color: '#4b5563', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              L’acompte de {summary.depositLabel} est encaissé. Un e-mail de confirmation vous a été
              envoyé.
            </p>

            {/* Consignes après paiement — ce que le client doit savoir ou
                préparer avant le rendez-vous, plutôt qu'un simple accusé de
                paiement qui le laisse sans prochaine étape claire. */}
            <div
              style={{
                textAlign: 'left',
                padding: '1.1rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
              }}
            >
              <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.65rem' }}>
                Avant le rendez-vous
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.15rem', display: 'grid', gap: '0.5rem', fontSize: '0.9rem', color: '#374151', lineHeight: 1.5 }}>
                {summary.slotLabel ? (
                  <li>
                    Rendez-vous <strong>{summary.slotLabel}</strong>
                    {summary.locationMode === 'domicile' ? ' — le professionnel se déplace chez vous.' : ' — dépôt du véhicule à l’atelier.'}
                  </li>
                ) : null}
                {summary.locationMode === 'domicile' ? (
                  <li>
                    Laissez le véhicule accessible à l’heure convenue, et un accès à l’eau et à
                    l’électricité à proximité si votre formule le nécessite.
                  </li>
                ) : (
                  <li>Prévoyez de déposer les clés au professionnel à l’heure convenue.</li>
                )}
                {summary.accessNote ? (
                  <li>
                    Votre consigne d’accès a bien été transmise : « {summary.accessNote} »
                  </li>
                ) : null}
                <li>
                  {summary.detailerName} vous recontacte si le moindre détail change avant votre
                  créneau.
                </li>
                <li>Annulation gratuite jusqu’à {summary.freeCancellationHours} h avant le rendez-vous.</li>
              </ul>
            </div>
          </>
        ) : cancelled ? (
          <>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.75rem' }}>
              Créneau libéré
            </p>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>
              Cette réservation n’est plus disponible.
            </h1>
            <p style={{ fontSize: '1rem', color: '#4b5563', lineHeight: 1.6 }}>
              Le créneau a été libéré. Reprenez une réservation depuis la page de{' '}
              {summary.detailerName} pour en choisir un autre.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.75rem' }}>
              Dernière étape
            </p>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>
              Réglez l’acompte pour garder votre créneau.
            </h1>
            <p style={{ fontSize: '1rem', color: '#4b5563', lineHeight: 1.6, marginBottom: '2rem' }}>
              Estimation {summary.quotedPriceLabel} · Acompte à régler maintenant :{' '}
              <strong>{summary.depositLabel}</strong>
            </p>
            {summary.paymentAvailable ? (
              <PayDepositButton
                bookingId={summary.id}
                label={`Payer l’acompte de ${summary.depositLabel}`}
              />
            ) : (
              <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                {summary.detailerName} n’a pas encore activé le paiement en ligne — il vous
                recontacte pour régler autrement.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
