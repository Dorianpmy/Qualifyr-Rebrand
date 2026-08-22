import Link from 'next/link';
import { PLAN_LABELS } from '@/lib/billing/plans';
import type { Capability, DenialReason } from '@/lib/billing/entitlements';
import { plansWith } from '@/lib/billing/entitlements';
import styles from '@/app/app/app.module.css';

/**
 * Écran d'un module verrouillé.
 *
 * **Il dit pourquoi, pas seulement que.** « Fonctionnalité indisponible »
 * laisse penser à une panne ; un professionnel qui vient de payer se demande
 * ce qui est cassé au lieu de comprendre ce qu'il n'a pas acheté. Chaque cause
 * de refus a donc son message, et le cas le plus fréquent — le module n'est
 * pas dans l'offre — nomme l'offre qui le débloque.
 *
 * **Rien n'est masqué en silence.** La barre d'onglets continue d'afficher le
 * module, et c'est cet écran qui explique. Faire disparaître l'entrée aurait
 * été plus propre visuellement, mais un client qui ne voit pas ce qu'il rate
 * ne monte jamais en gamme — et surtout, il ne comprend pas la différence
 * entre les offres qu'on lui a vendues.
 *
 * **Le bouton est visible sans être insistant** : un lien bordé, pas un aplat
 * plein. La page n'est pas une page de vente, c'est une explication qui offre
 * une sortie.
 */

function title(reason: DenialReason): string {
  switch (reason) {
    case 'no-subscription':
      return 'Aucun abonnement actif';
    case 'plan-excludes':
      return 'Pas inclus dans votre offre';
    case 'read-only':
      return 'Abonnement résilié';
    case 'payment-required':
      return 'Paiement à régulariser';
  }
}

function body(reason: DenialReason, capability: Capability): string {
  switch (reason) {
    case 'no-subscription':
      return 'Ce compte n’est rattaché à aucun abonnement. Choisissez une offre pour ouvrir votre espace.';
    case 'plan-excludes': {
      const plans = plansWith(capability).map((plan) => PLAN_LABELS[plan]);
      const list =
        plans.length > 1 ? `${plans.slice(0, -1).join(', ')} ou ${plans.at(-1)}` : plans[0];
      return `Ce module fait partie de l’offre ${list ?? 'supérieure'}. Le reste de votre espace fonctionne normalement.`;
    }
    case 'read-only':
      return 'Votre abonnement est résilié. Vos données restent consultables — rien n’a été supprimé — mais vous ne pouvez plus en créer de nouvelles.';
    case 'payment-required':
      return 'Le dernier paiement n’a pas abouti. Dès qu’il est régularisé, l’accès revient sans intervention de votre part.';
  }
}

export function LockedModule({
  reason,
  capability,
  moduleName,
}: {
  readonly reason: DenialReason;
  readonly capability: Capability;
  readonly moduleName: string;
}) {
  return (
    <main className={styles.main}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.title}>{moduleName}</h1>
          <p className={styles.subtitle}>{title(reason)}</p>
        </div>
      </div>

      <div className={styles.panel} style={{ padding: '1.75rem 1.5rem' }}>
        <p
          style={{
            margin: 0,
            maxWidth: '34rem',
            fontSize: '0.9375rem',
            lineHeight: 1.6,
            color: '#a7adb8',
          }}
        >
          {body(reason, capability)}
        </p>

        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/app/abonnement" className={`app-ghost ${styles.btnGhost}`}>
            Voir mon abonnement
          </Link>
          {reason !== 'read-only' ? (
            <Link href="/tarifs" className={`app-ghost ${styles.btnGhost}`}>
              Comparer les offres
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
