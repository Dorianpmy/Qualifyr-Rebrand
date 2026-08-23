import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { isProduction } from '@/lib/env';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import { SEGMENTS, countBySegment, scanZone } from '@/lib/agent/sirene';
import { buildReportErrorMessage, nextReportState } from '@/lib/agent/report-retry';

/**
 * Traitement différé des zones en attente.
 *
 * Appelée par le planificateur, toutes les quinze minutes. Deux files
 * distinctes à chaque passage, traitées l'une après l'autre plutôt que de se
 * disputer le même unique passage :
 *
 * 1. **Un lot de renvois de rapport** (`rapport_en_attente`) — l'analyse a
 *    déjà abouti, seul l'envoi a échoué. Coût : une requête HTTP vers Resend
 *    par zone, rien de plus.
 * 2. **Une zone à analyser** (`en_attente`) — le traitement complet
 *    d'aujourd'hui : quota Sirene, une à deux minutes.
 *
 * **Pourquoi séparé.** Pendant une panne de configuration (`BOOKING_FROM_EMAIL`
 * absente, par exemple), des zones s'accumulent en `rapport_en_attente`. Si
 * elles partageaient la même file qu'`en_attente`, triée par ancienneté,
 * elles passeraient toujours en premier — et plus aucune nouvelle zone ne
 * serait jamais analysée tant que la configuration resterait cassée. Deux
 * files distinctes, un lot de chacune à chaque passage : l'incident sur
 * l'envoi n'affame jamais l'analyse.
 *
 * **Protégée par un secret.** Sans lui, n'importe qui déclencherait des
 * analyses en boucle et ferait sauter le quota de la clé INSEE.
 *
 * **Pas de contrôle d'abonnement ici, et c'est délibéré.** Cette route ne
 * répond à personne : elle est appelée par le planificateur avec un secret
 * partagé, et traite une file de zones déjà enregistrées. Le droit de créer
 * une zone se vérifie **à l'entrée**, dans `api/app/agent-zones` (capacité
 * `agent.prospecting`) — une zone présente dans la file a donc déjà été
 * autorisée. Refaire ce contrôle ici bloquerait aussi les zones gratuites
 * demandées depuis le site vitrine par des visiteurs sans compte, qui sont
 * précisément l'offre d'appel.
 */

export const dynamic = 'force-dynamic';
/*
 * 60 secondes : la limite des fonctions sur les offres gratuites et Pro
 * d'hébergement. Déclarer 300 sans le forfait correspondant fait échouer le
 * déploiement, ou coupe la fonction en plein traitement sans message clair.
 *
 * Le budget est donc tenu en amont : trois codes postaux maximum par zone et
 * une pause de 1,5 seconde entre deux appels — soit environ vingt secondes de
 * traitement pour quatre segments, avec de la marge pour la latence. Le lot
 * de renvois (dix appels HTTP simples vers Resend, quelques secondes au
 * total) tient largement dans la marge restante.
 */
export const maxDuration = 60;

/**
 * Zones dont le rapport reste à (re)tenter, traitées par lot à chaque
 * passage plutôt qu'une par une : contrairement à l'analyse, un renvoi ne
 * consomme aucun quota externe partagé (Sirene) — rien ne justifie de le
 * limiter à un par passage comme l'analyse.
 */
const REPORT_RETRY_BATCH = 10;

/**
 * Codes postaux couverts par le rayon.
 *
 * **Approximation assumée, et documentée dans le rapport.** Sirene cherche par
 * code postal, pas dans un cercle. Convertir un rayon en liste exacte de codes
 * postaux demanderait une base de contours communaux ; ici on prend le code
 * demandé et ses voisins immédiats par incrément numérique, ce qui couvre les
 * arrondissements d'une même ville et les communes limitrophes dans la plupart
 * des cas.
 *
 * Le rapport dit « autour du 69003 » et non « dans un rayon de 15 km
 * exactement » — la formulation doit refléter ce que la méthode fait vraiment.
 */
function nearbyPostalCodes(postalCode: string, radiusKm: number): readonly string[] {
  const base = Number(postalCode);
  if (!Number.isFinite(base)) return [postalCode];

  // Un seul voisin de chaque côté : trois codes postaux au total. Au-delà, le
  // traitement dépasse la limite de durée des fonctions.
  const spread = 1;
  void radiusKm;
  const codes: string[] = [];

  for (let offset = -spread; offset <= spread; offset += 1) {
    const candidate = base + offset;
    if (candidate > 0) codes.push(String(candidate).padStart(postalCode.length, '0'));
  }

  return codes;
}

/** Tout ce dont `reportHtml` a besoin d'un établissement — jamais le type
 *  `Establishment` complet : sur un renvoi, ces valeurs viennent d'une
 *  relecture d'`agent_prospects` (`name`, `city` seulement), et fabriquer de
 *  faux `siret`/`nafCode`/… pour satisfaire un type plus large inventerait
 *  une donnée que personne n'a. */
type ReportSample = {
  readonly name: string;
  readonly city: string | null;
};

function reportHtml(input: {
  readonly postalCode: string;
  readonly counts: Record<string, number>;
  readonly total: number;
  readonly samples: readonly ReportSample[];
}): string {
  const rows = SEGMENTS.filter((segment) => (input.counts[segment.key] ?? 0) > 0)
    .map(
      (segment) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">
            <strong>${segment.label}</strong><br>
            <span style="color:#666;font-size:13px;">${segment.why}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-size:20px;font-weight:700;">
            ${input.counts[segment.key]}
          </td>
        </tr>`,
    )
    .join('');

  const samples = input.samples
    .slice(0, 8)
    .map(
      (item) =>
        `<li style="margin-bottom:6px;">${item.name}${item.city ? ` — ${item.city}` : ''}</li>`,
    )
    .join('');

  return `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#111;">
  <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#888;margin:0 0 6px;">
    Analyse de secteur
  </p>
  <h1 style="font-size:22px;margin:0 0 6px;">Autour du ${input.postalCode}</h1>
  <p style="color:#555;font-size:15px;line-height:1.5;margin:0 0 24px;">
    ${input.total} établissements professionnels susceptibles d’avoir des véhicules à
    entretenir, répartis comme suit.
  </p>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${rows}</table>

  ${
    samples
      ? `<p style="font-size:14px;font-weight:600;margin:0 0 8px;">Quelques exemples</p>
         <ul style="color:#555;font-size:14px;padding-left:18px;margin:0 0 24px;">${samples}</ul>`
      : ''
  }

  <!-- La méthode est dite, pas cachée. Un professionnel qui compte lui-même
       les loueurs de sa rue doit retrouver nos chiffres, ou comprendre
       pourquoi ils diffèrent. -->
  <p style="font-size:12px;color:#888;line-height:1.5;border-top:1px solid #eee;padding-top:16px;">
    Source : répertoire Sirene de l’INSEE, établissements en activité, recherche par code postal
    autour du ${input.postalCode}. Ce sont des entreprises, pas des particuliers.
    Vous recevez ce message parce que vous avez demandé une analyse sur qualifyragence.com.
  </p>
</div>`;
}

/**
 * Tente l'envoi du rapport d'une zone dont le total est déjà connu — depuis
 * un scan qui vient d'aboutir, ou depuis une relecture d'`agent_prospects`
 * sur un renvoi.
 *
 * **Pas de repli en production, ni pour `RESEND_API_KEY` ni pour
 * `BOOKING_FROM_EMAIL`.** `onboarding@resend.dev` accepte l'envoi sans
 * erreur mais ne livre qu'au propriétaire du compte Resend : le
 * professionnel qui a demandé cette analyse ne recevrait jamais rien, sans
 * qu'aucune erreur ne le signale nulle part — c'est le défaut que ce
 * mécanisme corrige, pas quelque chose à réintroduire ici. Hors production,
 * le repli reste utile pour dérouler le parcours sans configuration, même
 * principe que `resolveTransport()` dans `lib/email/transport.ts`.
 */
async function attemptReportSend(input: {
  readonly total: number;
  readonly email: string;
  readonly postalCode: string;
  readonly counts: Record<string, number>;
  readonly samples: readonly ReportSample[];
}): Promise<{ readonly reportSent: boolean; readonly sendFailureReason: string | null }> {
  if (input.total === 0) return { reportSent: false, sendFailureReason: null };

  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.BOOKING_FROM_EMAIL ?? (!isProduction() ? 'Qualifyr <onboarding@resend.dev>' : null);

  if (!apiKey) return { reportSent: false, sendFailureReason: 'RESEND_API_KEY manquante' };
  if (!from) return { reportSent: false, sendFailureReason: 'BOOKING_FROM_EMAIL manquante en production' };

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.email,
    subject: `${input.total} professionnels autour du ${input.postalCode}`,
    html: reportHtml({
      postalCode: input.postalCode,
      counts: input.counts,
      total: input.total,
      samples: input.samples,
    }),
  });

  if (error) {
    console.error('[agent/process] envoi du rapport', error);
    return { reportSent: false, sendFailureReason: `échec Resend : ${error.message}` };
  }

  return { reportSent: true, sendFailureReason: null };
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Base indisponible.' }, { status: 503 });
  }

  const now = new Date();

  // --- 1. Renvois en attente, par lot -------------------------------------

  const { data: pendingReports } = await supabase
    .from('agent_zones')
    .select('id, email, postal_code, segments, report_attempts, report_first_failed_at')
    .eq('status', 'rapport_en_attente')
    .order('report_first_failed_at', { ascending: true })
    .limit(REPORT_RETRY_BATCH);

  let reportsRetried = 0;
  let reportsResolved = 0;

  if (pendingReports && pendingReports.length > 0) {
    // Marquées en cours avant traitement, comme la zone d'analyse plus bas :
    // si deux passages du planificateur se chevauchent, le second ne reprend
    // pas le même lot.
    await supabase
      .from('agent_zones')
      .update({ status: 'en_cours' })
      .in(
        'id',
        pendingReports.map((z) => z.id),
      );

    for (const pending of pendingReports) {
      reportsRetried += 1;

      try {
        const counts = (pending.segments as Record<string, number> | null) ?? {};
        const { data: prospects, count } = await supabase
          .from('agent_prospects')
          .select('name, city', { count: 'exact' })
          .eq('zone_id', pending.id)
          .limit(8);

        const total = count ?? 0;
        const samples = (prospects ?? []) as ReportSample[];

        const { reportSent, sendFailureReason } = await attemptReportSend({
          total,
          email: pending.email as string,
          postalCode: pending.postal_code as string,
          counts,
          samples,
        });

        const outcome = nextReportState({
          total,
          reportSent,
          previousAttempts: pending.report_attempts as number,
          previousFirstFailedAt: pending.report_first_failed_at as string | null,
          now,
        });

        if (outcome.status === 'termine') reportsResolved += 1;

        await supabase
          .from('agent_zones')
          .update({
            status: outcome.status,
            report_attempts: outcome.reportAttempts,
            report_first_failed_at: outcome.reportFirstFailedAt,
            report_sent_at: reportSent ? now.toISOString() : null,
            error_message: buildReportErrorMessage({
              scanErrors: [],
              sendFailureReason,
              capped: outcome.status === 'echec',
              attempts: outcome.reportAttempts,
            }),
          })
          .eq('id', pending.id);
      } catch (cause) {
        /*
         * Panne d'infrastructure pendant ce passage (Supabase, réseau) plutôt
         * qu'un échec d'envoi caractérisé : on ne compte pas cette tentative
         * ni ne touche l'horloge — celle-ci mesure depuis quand l'*envoi*
         * échoue, pas les aléas de ce passage précis. La zone reste
         * `rapport_en_attente`, reprise au passage suivant.
         */
        console.error('[agent/process] renvoi échoué', pending.id, cause);
        await supabase
          .from('agent_zones')
          .update({ status: 'rapport_en_attente' })
          .eq('id', pending.id);
      }
    }
  }

  // --- 2. Une nouvelle zone à analyser -------------------------------------

  const { data: zone } = await supabase
    .from('agent_zones')
    .select('id, email, postal_code, radius_km')
    .eq('status', 'en_attente')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!zone) {
    return NextResponse.json({ processed: 0, reportsRetried, reportsResolved });
  }

  // Marquée en cours **avant** l'analyse : si deux passages du planificateur
  // se chevauchent, le second ne reprend pas la même zone.
  await supabase.from('agent_zones').update({ status: 'en_cours' }).eq('id', zone.id);

  try {
    const { establishments, errors } = await scanZone({
      postalCodes: nearbyPostalCodes(zone.postal_code as string, Number(zone.radius_km)),
      perSegment: 20,
    });

    // Diagnostic temporaire : les erreurs par segment n'étaient nulle part
    // visibles avant ce log — seul leur nombre remontait dans la réponse HTTP.
    if (errors.length > 0) {
      console.error('[agent/process] erreurs partielles', zone.id, errors);
    }

    const counts = countBySegment(establishments);
    const total = establishments.length;

    if (total > 0) {
      await supabase.from('agent_prospects').insert(
        establishments.map((item) => ({
          zone_id: zone.id,
          siret: item.siret,
          name: item.name,
          naf_code: item.nafCode,
          segment: item.segment,
          address: item.address,
          postal_code: item.postalCode,
          city: item.city,
          workforce_range: item.workforceRange,
          source: 'sirene',
          legal_basis: 'interet_legitime',
        })),
      );
    }

    // --- Rapport ------------------------------------------------------------

    const { reportSent, sendFailureReason } = await attemptReportSend({
      total,
      email: zone.email as string,
      postalCode: zone.postal_code as string,
      counts,
      samples: establishments,
    });

    const outcome = nextReportState({
      total,
      reportSent,
      previousAttempts: 0,
      previousFirstFailedAt: null,
      now,
    });

    await supabase
      .from('agent_zones')
      .update({
        status: outcome.status,
        segments: counts,
        processed_at: now.toISOString(),
        report_attempts: outcome.reportAttempts,
        report_first_failed_at: outcome.reportFirstFailedAt,
        report_sent_at: reportSent ? now.toISOString() : null,
        error_message: buildReportErrorMessage({
          scanErrors: errors,
          sendFailureReason,
          capped: outcome.status === 'echec',
          attempts: outcome.reportAttempts,
        }),
      })
      .eq('id', zone.id);

    return NextResponse.json({
      processed: 1,
      found: total,
      reportSent,
      status: outcome.status,
      partialErrors: errors.length,
      reportsRetried,
      reportsResolved,
    });
  } catch (cause) {
    /*
     * La zone repasse en attente plutôt qu'en échec définitif : la cause la
     * plus probable est un quota dépassé ou une coupure réseau, deux
     * situations qui se résolvent au passage suivant.
     */
    await supabase
      .from('agent_zones')
      .update({
        status: 'en_attente',
        error_message: cause instanceof Error ? cause.message : 'inconnue',
      })
      .eq('id', zone.id);

    console.error('[agent/process] échec', zone.id, cause);
    return NextResponse.json({ error: 'Analyse impossible.' }, { status: 500 });
  }
}
