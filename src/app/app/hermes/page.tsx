import { AppShell } from '@/components/app/AppShell';
import { HermesSettings } from '@/components/app/HermesSettings';
import { ImportProspects } from '@/components/app/ImportProspects';
import { LockedModule } from '@/components/app/LockedModule';
import { pageAccess } from '@/lib/billing/page-guard';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import {
  IMPORT_ATTESTATION_TEXT,
  MAX_IMPORT_SIZE,
  countContactableImportedProspects,
  listImportedProspects,
} from '@/lib/agent/import-prospects';
import styles from '../app.module.css';

/**
 * Hermès — l'écran où le professionnel active la prospection.
 *
 * **Il est protégé par `agent.prospecting`, la capacité de l'offre « Agent
 * seul ».** C'est le seul écran du produit qui soit accessible à un abonné
 * sans fiche detailer : quelqu'un qui paie 9 €/mois pour qu'un agent démarche
 * à sa place n'a pas de page de réservation, pas de planning, pas de
 * prestations. Le tableau de bord entier lui est fermé, celui-ci non — sans
 * quoi il paierait pour un écran verrouillé.
 *
 * **Le décompte des entreprises joignables est calculé ici, côté serveur.**
 * Il répond à la première question que se pose le professionnel en ouvrant la
 * page : « sur combien de monde ça va tourner ? ». Un chiffre à zéro veut dire
 * qu'il faut d'abord analyser une zone, et c'est une information plus utile
 * qu'un formulaire vide.
 *
 * `dynamic` forcé : les réglages changent depuis cette page, et un instantané
 * de build afficherait au professionnel la campagne qu'il vient de remplacer.
 */

export const dynamic = 'force-dynamic';

/**
 * Combien d'entreprises ce compte peut-il encore contacter ?
 *
 * **Deux bassins, même périmètre que `nextCandidates`** (migration 022) :
 * les prospects recensés dans les zones du compte (retrouvées par e-mail) et
 * les prospects importés (scopés par `owner_id`). Le chiffre affiché doit
 * correspondre à ce que le moteur enverra réellement — un décompte plus
 * large ferait attendre des envois qui n'arriveraient jamais.
 */
async function countAvailableProspects(ownerEmail: string, ownerId: string): Promise<number> {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return 0;

  const { data: zones } = await supabase.from('agent_zones').select('id').ilike('email', ownerEmail);

  let recensed = 0;
  if (zones && zones.length > 0) {
    const { count } = await supabase
      .from('agent_prospects')
      .select('id', { count: 'exact', head: true })
      .in(
        'zone_id',
        (zones as readonly { id: string }[]).map((z) => z.id),
      )
      .not('email', 'is', null)
      .is('contacted_at', null)
      .is('opted_out_at', null);
    recensed = count ?? 0;
  }

  const imported = await countContactableImportedProspects(supabase, ownerId);

  return recensed + imported;
}

export default async function HermesPage() {
  /* Lecture : un abonnement en impayé doit pouvoir consulter ce qui part en
     son nom. Ce sont les routes d'API qui exigent le droit d'écriture. */
  const access = await pageAccess('agent.prospecting', { write: false });

  if (!access.allowed) {
    return (
      <AppShell
        detailerName={access.user.email}
        detailerSlug=""
        city={null}
        active="abonnement"
      >
        <LockedModule reason={access.reason} capability="agent.prospecting" moduleName="Démarchage" />
      </AppShell>
    );
  }

  const { user } = access;

  const supabase = getServiceSupabaseClient();
  const { data: campaignRow } = supabase
    ? await supabase
        .from('hermes_campaigns')
        .select(
          'sender_name, reply_to_email, subject, body, daily_quota, activity_description, paused_at',
        )
        .eq('owner_id', user.id)
        .maybeSingle()
    : { data: null };

  const row = campaignRow as {
    sender_name: string;
    reply_to_email: string;
    subject: string;
    body: string;
    daily_quota: number;
    activity_description: string | null;
    paused_at: string | null;
  } | null;

  const availableProspects = await countAvailableProspects(user.email, user.id);

  /* La fiche detailer est facultative : un abonné « Agent seul » n'en a pas.
     `AppShell` sait déjà traiter un slug vide — le bouton « Page client »
     devient inerte plutôt que de mener à une adresse inexistante. */
  const detailer = await getDetailerForOwner(user.id);

  const supabaseForImports = getServiceSupabaseClient();
  const importedProspects = supabaseForImports
    ? await listImportedProspects(supabaseForImports, user.id)
    : [];

  return (
    <AppShell
      detailerName={detailer?.name ?? user.email}
      detailerSlug={detailer?.slug ?? ''}
      city={detailer?.city ?? null}
      active="hermes"
    >
      {/* `.main`/`.title`/`.subtitle` : cette page utilisait des tailles
          Tailwind posées à la main (titre 1.35rem, pas de largeur maximale)
          au lieu des classes partagées du dashboard — visiblement plus
          grande que le reste du SaaS pour Dorian (12/09/2026). Alignée sur
          `invoices/page.tsx`, `cases/page.tsx`, etc. */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.title}>Démarchage</h1>
            <p className={styles.subtitle}>
              L’agent écrit chaque jour aux entreprises recensées dans vos zones, en votre nom.
              Vous recevez les réponses directement. Vous pouvez l’arrêter à tout moment.
            </p>
          </div>
        </div>

        {availableProspects === 0 ? (
          /* Dire pourquoi rien ne partira, plutôt que d'afficher un formulaire
             qui n'aura aucun effet. Le professionnel repartirait sinon en
             croyant le démarchage actif. */
          <div className={styles.panel} style={{ padding: '1rem 1.1rem', marginBottom: '1.25rem' }}>
            <p className={styles.clientMeta}>
              Aucune entreprise à contacter pour l’instant. Analysez d’abord une zone, ou importez
              une liste que vous connaissez déjà.
            </p>
          </div>
        ) : null}

        <HermesSettings
          initial={
            row
              ? {
                  senderName: row.sender_name,
                  replyToEmail: row.reply_to_email,
                  subject: row.subject,
                  body: row.body,
                  dailyQuota: row.daily_quota,
                  activityDescription: row.activity_description,
                  paused: row.paused_at !== null,
                }
              : null
          }
          accountEmail={user.email}
          availableProspects={availableProspects}
        />

        <ImportProspects
          initialProspects={importedProspects}
          attestationText={IMPORT_ATTESTATION_TEXT}
          maxImportSize={MAX_IMPORT_SIZE}
        />
      </main>
    </AppShell>
  );
}
