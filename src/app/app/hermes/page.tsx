import { AppShell } from '@/components/app/AppShell';
import { HermesSettings } from '@/components/app/HermesSettings';
import { LockedModule } from '@/components/app/LockedModule';
import { pageAccess } from '@/lib/billing/page-guard';
import { getDetailerForOwner } from '@/lib/detailing/dashboard';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';

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
 * Combien d'entreprises recensées ce compte peut-il encore contacter ?
 *
 * Même périmètre que `nextCandidates` : les zones du compte, retrouvées par
 * e-mail. Le chiffre affiché doit correspondre à ce que le moteur enverra
 * réellement — un décompte plus large ferait attendre des envois qui
 * n'arriveraient jamais.
 */
async function countAvailableProspects(ownerEmail: string): Promise<number> {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return 0;

  const { data: zones } = await supabase.from('agent_zones').select('id').ilike('email', ownerEmail);
  if (!zones || zones.length === 0) return 0;

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

  return count ?? 0;
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
        <LockedModule reason={access.reason} capability="agent.prospecting" moduleName="Hermès" />
      </AppShell>
    );
  }

  const { user } = access;

  const supabase = getServiceSupabaseClient();
  const { data: campaignRow } = supabase
    ? await supabase
        .from('hermes_campaigns')
        .select('sender_name, reply_to_email, subject, body, daily_quota, paused_at')
        .eq('owner_id', user.id)
        .maybeSingle()
    : { data: null };

  const row = campaignRow as {
    sender_name: string;
    reply_to_email: string;
    subject: string;
    body: string;
    daily_quota: number;
    paused_at: string | null;
  } | null;

  const availableProspects = await countAvailableProspects(user.email);

  /* La fiche detailer est facultative : un abonné « Agent seul » n'en a pas.
     `AppShell` sait déjà traiter un slug vide — le bouton « Page client »
     devient inerte plutôt que de mener à une adresse inexistante. */
  const detailer = await getDetailerForOwner(user.id);

  return (
    <AppShell
      detailerName={detailer?.name ?? user.email}
      detailerSlug={detailer?.slug ?? ''}
      city={detailer?.city ?? null}
      active="hermes"
    >
      <header className="mb-6">
        <h1 className="mb-2 text-[1.35rem] font-bold tracking-[-0.02em] text-primary">Hermès</h1>
        <p className="max-w-[38rem] text-[0.9375rem] leading-[1.65] text-muted">
          Hermès écrit chaque jour aux entreprises que l’agent a recensées dans vos zones, en
          votre nom. Vous recevez les réponses directement. Vous pouvez l’arrêter à tout moment.
        </p>
      </header>

      {availableProspects === 0 ? (
        /* Dire pourquoi rien ne partira, plutôt que d'afficher un formulaire
           qui n'aura aucun effet. Le professionnel repartirait sinon en
           croyant Hermès actif. */
        <p className="mb-6 rounded-2xl border border-hairline px-4 py-3.5 text-[0.875rem] leading-[1.6] text-muted">
          Aucune entreprise à contacter pour l’instant. Analysez d’abord une zone : Hermès
          écrira aux établissements qu’elle contient.
        </p>
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
                paused: row.paused_at !== null,
              }
            : null
        }
        accountEmail={user.email}
        availableProspects={availableProspects}
      />
    </AppShell>
  );
}
