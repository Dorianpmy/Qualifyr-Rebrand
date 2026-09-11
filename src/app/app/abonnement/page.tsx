import Link from 'next/link';
import { BillingPortalButton } from '@/components/app/BillingPortalButton';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { capabilitiesOf, type Capability } from '@/lib/billing/entitlements';
import { PLAN_LABELS } from '@/lib/billing/plans';
import { getEntitlement } from '@/lib/billing/subscription';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { getSessionUser } from '@/lib/detailing/session';
import styles from '../app.module.css';

/**
 * Page d'abonnement — plan actif, échéance, état.
 *
 * **Elle n'est jamais verrouillée.** C'est la seule page de l'espace pro
 * accessible sans droit : un compte sans abonnement, impayé ou résilié doit
 * pouvoir arriver quelque part qui lui explique sa situation. La verrouiller
 * enfermerait dehors exactement les comptes qui ont besoin d'agir.
 *
 * **Elle ne vend pas, elle informe.** Le lien vers les tarifs est un lien
 * bordé parmi d'autres, pas une bannière. Un client qui paie déjà n'a pas à
 * subir une page de vente pour vérifier sa date de renouvellement.
 */

export const dynamic = 'force-dynamic';

/** Libellés des capacités, pour lister ce que l'offre inclut. */
const CAPABILITY_LABELS: Readonly<Record<Capability, string>> = {
  'agent.prospecting': 'Zones de prospection',
  'agent.report': 'Rapport de secteur par e-mail',
  dashboard: 'Tableau de bord des demandes',
  planning: 'Planning',
  services: 'Prestations et tarifs',
  'booking.public': 'Page de réservation publique',
  'payments.deposit': 'Encaissement d’acompte',
  invoices: 'Factures',
  gallery: 'Galerie avant/après',
  'booking.recovery': 'Relance automatique',
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * L'état de l'abonnement, en une phrase que le professionnel peut agir.
 *
 * Chaque statut a sa phrase : « votre abonnement est actif » n'aide personne
 * si le paiement a échoué et que l'accès va tomber dans trois jours.
 */
function statusNotice(input: {
  readonly status: string;
  readonly periodEnd: string | null;
  readonly trialEnd: string | null;
  readonly cancelAtPeriodEnd: boolean;
}): { readonly tone: 'neutral' | 'warning'; readonly text: string } {
  const end = formatDate(input.periodEnd);

  switch (input.status) {
    case 'trialing': {
      const trial = formatDate(input.trialEnd);
      return {
        tone: 'neutral',
        text: trial
          ? `Période d’essai jusqu’au ${trial}.`
          : 'Période d’essai en cours.',
      };
    }
    case 'active':
      if (input.cancelAtPeriodEnd) {
        return {
          tone: 'warning',
          text: end
            ? `Résiliation programmée : votre accès se termine le ${end}.`
            : 'Résiliation programmée à la fin de la période en cours.',
        };
      }
      return {
        tone: 'neutral',
        text: end ? `Renouvellement le ${end}.` : 'Abonnement actif.',
      };
    case 'past_due':
      return {
        tone: 'warning',
        text: 'Le dernier paiement n’a pas abouti. Votre accès est maintenu le temps que Stripe réessaie — mettez votre moyen de paiement à jour pour ne pas l’interrompre.',
      };
    case 'canceled':
      return {
        tone: 'warning',
        text: 'Abonnement résilié. Vos données restent consultables, rien n’a été supprimé, mais vous ne pouvez plus en créer de nouvelles.',
      };
    case 'unpaid':
      return {
        tone: 'warning',
        text: 'Abonnement impayé : l’accès est suspendu. Il revient dès la régularisation.',
      };
    default:
      return {
        tone: 'warning',
        text: 'Abonnement en attente de confirmation par Stripe. Si cela dure, écrivez-nous.',
      };
  }
}

export default async function SubscriptionPage() {
  const user = await getSessionUser();
  if (!user) redirect('/app/login');

  const [entitlement, detailer] = await Promise.all([
    getEntitlement(user.id),
    getDetailerForOwner(user.id),
  ]);

  const notice = entitlement
    ? statusNotice({
        status: entitlement.status,
        periodEnd: entitlement.currentPeriodEnd,
        trialEnd: entitlement.trialEndsAt,
        cancelAtPeriodEnd: entitlement.cancelAtPeriodEnd,
      })
    : null;

  return (
    <AppShell
      detailerName={detailer?.name ?? user.email}
      detailerSlug={detailer?.slug ?? ''}
      city={detailer?.city ?? null}
      active="abonnement"
    >
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.title}>Abonnement</h1>
            <p className={styles.subtitle}>
              {entitlement ? PLAN_LABELS[entitlement.plan] : 'Aucun abonnement actif'}
            </p>
          </div>
        </div>

        {notice ? (
          <div
            className={styles.panel}
            style={{
              padding: '1.1rem 1.35rem',
              marginBottom: '1.25rem',
              // Le céladon de la charte pour l'avertissement — jamais de
              // rouge ni d'orange, que la charte du produit exclut.
              borderColor:
                notice.tone === 'warning' ? 'rgba(184,207,228,0.35)' : undefined,
            }}
          >
            <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.6, color: '#e0e0e0' }}>
              {notice.text}
            </p>
          </div>
        ) : (
          <div className={styles.panel} style={{ padding: '1.75rem 1.5rem', marginBottom: '1.25rem' }}>
            <p
              style={{
                margin: '0 0 1rem',
                maxWidth: '34rem',
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                color: '#a7adb8',
              }}
            >
              Ce compte n’est rattaché à aucun abonnement. Si vous venez de payer, l’activation
              peut prendre une minute — rechargez la page. Sinon, choisissez une offre.
            </p>
            <Link href="/tarifs" className={`app-primary ${styles.btnPrimary}`}>
              Voir les offres
            </Link>
          </div>
        )}

        {entitlement ? (
          <div className={styles.panel} style={{ padding: '1.5rem' }}>
            <p
              style={{
                margin: '0 0 0.9rem',
                fontSize: '0.6875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#7a8190',
              }}
            >
              Inclus dans votre offre
            </p>

            <ul style={{ display: 'grid', gap: '0.55rem', margin: 0, padding: 0, listStyle: 'none' }}>
              {capabilitiesOf(entitlement.plan).map((capability) => (
                <li
                  key={capability}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    fontSize: '0.875rem',
                    color: '#a7adb8',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: '0.35rem',
                      height: '0.35rem',
                      borderRadius: '999px',
                      background: '#b8cfe4',
                      flexShrink: 0,
                    }}
                  />
                  {CAPABILITY_LABELS[capability]}
                </li>
              ))}
            </ul>

            {/* Le portail plutôt qu'un retour vers `/tarifs`.

                Repasser par la page publique crée un **second** abonnement
                Stripe : les droits s'ouvrent, mais les deux prélèvements
                courent en parallèle, et rien ici ne le signale puisque la base
                ne connaît qu'un abonnement vivant à la fois. Le portail modifie
                l'abonnement existant et calcule le prorata.

                Affiché quelle que soit l'offre, y compris `complete` : on n'y
                change pas seulement de formule, on y trouve aussi ses factures,
                sa carte et la résiliation. */}
            <div style={{ marginTop: '1.35rem', display: 'grid', gap: '0.75rem' }}>
              <BillingPortalButton
                label={
                  entitlement.plan === 'complete'
                    ? 'Gérer mon abonnement'
                    : 'Changer d’offre ou gérer mon abonnement'
                }
              />
              {entitlement.plan !== 'complete' ? (
                <Link
                  href="/tarifs"
                  style={{ fontSize: '0.8125rem', color: '#7a8190' }}
                >
                  Comparer les offres
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </main>
    </AppShell>
  );
}
