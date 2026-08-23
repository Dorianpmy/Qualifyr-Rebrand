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
 * distinctes à chaque passage :
 *
 * 1. **Une zone à analyser** (`en_attente`) — quota Sirene, environ vingt
 *    secondes (voir le calcul sur `maxDuration` plus bas). Traitée en
 *    premier : c'est le travail qui coûte et qui ne se rejoue pas.
 * 2. **Un lot de renvois de rapport** (`rapport_en_attente`) — l'analyse a
 *    déjà abouti, seul l'envoi a échoué. Traité ensuite : une requête HTTP
 *    vers Resend par zone, rien de plus, et rejouable sans perte au passage
 *    suivant si ce passage manque de temps.
 *
 * **Pourquoi cet ordre, et pourquoi il ne réintroduit pas la famine
 * corrigée précédemment.** La famine venait de fusionner les deux files en
 * une seule requête triée par ancienneté : les renvois, plus anciens par
 * construction, passaient alors toujours avant les nouvelles zones, qui
 * n'étaient plus jamais analysées pendant une panne de configuration. Ici,
 * les deux files restent séparées et **toutes deux traitées dans le même
 * passage** — seul l'ordre à l'intérieur d'un même passage change. Si ce
 * passage manque de temps, c'est le lot de renvois qui est écourté, jamais
 * l'analyse : un renvoi écourté attend simplement le passage suivant, sans
 * perte, alors qu'une analyse écourtée aurait gâché du quota Sirene pour
 * rien.
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
 * **Budget réel de l'analyse, calculé et non estimé** (corrigé le 24/08/2026 —
 * le commentaire de `netlify/functions/agent-process-cron.ts` annonçait « une
 * à deux minutes », en contradiction avec celui-ci ; c'est ce fichier qui
 * était juste). `nearbyPostalCodes` rend au plus trois codes postaux,
 * `SEGMENTS` en compte quatre : douze appels Sirene au maximum, chacun suivi
 * d'une pause fixe de 1,5 s pour tenir le quota (`scanZone`, dans
 * `lib/agent/sirene.ts`) — 18 secondes de pause garantie, plus la latence
 * réelle des appels, pour un total d'environ vingt secondes. Le lot de
 * renvois (dix appels HTTP simples vers Resend, sans pause imposée) tient
 * largement dans la marge restante.
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
 * Durée du bail posé sur une zone en cours de traitement (`locked_at`).
 *
 * **Pourquoi un bail.** `en_cours` est marqué avant de traiter une zone pour
 * qu'un passage qui chevaucherait le précédent ne la reprenne pas — mais rien
 * ne relit jamais `en_cours` après coup. Si le processus est tué en plein
 * traitement (dépassement de `maxDuration`, redéploiement, incident de la
 * plateforme), la zone y reste pour toujours : ni la file d'analyse
 * (`en_attente`), ni la file de renvoi (`rapport_en_attente`) ne la revoit,
 * et `requestZone` (`lib/agent/zones.ts`) traite `en_cours` comme une
 * demande déjà en cours — un visiteur qui redemande la même zone se voit
 * refusé au profit d'une zone morte.
 *
 * **Dix minutes.** Largement au-dessus des 60 secondes de `maxDuration` :
 * aucun risque de reprendre une requête réellement encore en cours, même si
 * la limite réelle de la plateforme diffère de ce que ce fichier suppose.
 * Largement sous les quinze minutes du cron : une zone tuée est reprise au
 * passage suivant, jamais laissée traîner un tour de plus.
 */
const MAX_LOCK_MS = 10 * 60 * 1000;

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
 *
 * **Risque résiduel accepté.** Si le processus est tué juste après que
 * Resend a confirmé l'envoi mais avant l'écriture du résultat, une reprise
 * (bail expiré ou passage suivant) retente l'envoi : un rapport peut partir
 * deux fois. Borné à un envoi superflu vers le professionnel qui l'a
 * demandé, jamais une boucle — accepté plutôt que de complexifier avec une
 * confirmation en deux temps pour ce volume.
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
  const lockThreshold = new Date(now.getTime() - MAX_LOCK_MS).toISOString();

  // --- 1. Une zone à analyser, avant les renvois ---------------------------

  let zoneResult = await supabase
    .from('agent_zones')
    .select('id, email, postal_code, radius_km')
    .eq('status', 'en_attente')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!zoneResult.data) {
    /*
     * Rien en attente : une zone dont le bail a expiré (processus tué en
     * plein traitement) est reprise ici. Deux requêtes plates plutôt qu'un
     * .or() imbriqué sur deux colonnes différentes — chaque motif est déjà
     * éprouvé ailleurs dans ce dépôt, une syntaxe PostgREST imbriquée ne
     * l'est pas, et ne peut pas être vérifiée sans base réelle.
     */
    zoneResult = await supabase
      .from('agent_zones')
      .select('id, email, postal_code, radius_km')
      .eq('status', 'en_cours')
      .lt('locked_at', lockThreshold)
      .order('locked_at', { ascending: true })
      .limit(1)
      .maybeSingle();
  }

  const zone = zoneResult.data;

  let scanError = false;
  let scanPayload: Record<string, unknown> = { processed: 0 };

  if (zone) {
    // Marquée en cours **avant** l'analyse, bail posé : si deux passages du
    // planificateur se chevauchent, le second ne reprend pas la même zone ;
    // si celui-ci est tué, le bail expire et un passage ultérieur la reprend.
    await supabase
      .from('agent_zones')
      .update({ status: 'en_cours', locked_at: now.toISOString() })
      .eq('id', zone.id);

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
        /*
         * Garde anti-doublon. Une zone reprise après expiration de son bail
         * peut déjà avoir ses établissements en base — le processus précédent
         * a pu être tué après cette insertion mais avant l'écriture finale du
         * statut. Réinsérer percuterait la contrainte unique (zone_id,
         * siret), ferait échouer la zone, et recommencerait au passage
         * suivant : une boucle qui reconsomme du quota Sirene à chaque
         * tentative, plus difficile à repérer qu'un simple blocage puisque
         * rien ne s'arrête ni ne le signale.
         */
        const { count: alreadyInserted } = await supabase
          .from('agent_prospects')
          .select('id', { count: 'exact', head: true })
          .eq('zone_id', zone.id);

        if (!alreadyInserted) {
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
          locked_at: null,
          error_message: buildReportErrorMessage({
            scanErrors: errors,
            sendFailureReason,
            capped: outcome.status === 'echec',
            attempts: outcome.reportAttempts,
          }),
        })
        .eq('id', zone.id);

      scanPayload = {
        processed: 1,
        found: total,
        reportSent,
        status: outcome.status,
        partialErrors: errors.length,
      };
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
          locked_at: null,
          error_message: cause instanceof Error ? cause.message : 'inconnue',
        })
        .eq('id', zone.id);

      console.error('[agent/process] échec', zone.id, cause);
      scanError = true;
    }
  }

  // --- 2. Un lot de renvois en attente --------------------------------------
  //
  // Traité même si l'analyse ci-dessus a échoué : un incident sur l'analyse
  // ne doit pas retarder des renvois qui n'ont rien à voir avec lui.

  const { data: pendingReports } = await supabase
    .from('agent_zones')
    .select('id, email, postal_code, segments, report_attempts, report_first_failed_at')
    .eq('status', 'rapport_en_attente')
    .or(`locked_at.is.null,locked_at.lt.${lockThreshold}`)
    .order('report_first_failed_at', { ascending: true })
    .limit(REPORT_RETRY_BATCH);

  let reportsRetried = 0;
  let reportsResolved = 0;

  if (pendingReports && pendingReports.length > 0) {
    // Les renvois ne transitent jamais par `en_cours` : ce statut ne dirait
    // plus, à la reprise, de quelle file une zone récupérée venait. Le bail
    // se pose ici sans changer le statut — `rapport_en_attente` reste
    // `rapport_en_attente` pendant le traitement.
    await supabase
      .from('agent_zones')
      .update({ locked_at: now.toISOString() })
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
            locked_at: null,
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
         * échoue, pas les aléas de ce passage précis. Le bail est relâché
         * immédiatement, pas laissé expirer : la zone reste `rapport_en_attente`,
         * reprise dès le passage suivant.
         */
        console.error('[agent/process] renvoi échoué', pending.id, cause);
        await supabase
          .from('agent_zones')
          .update({ status: 'rapport_en_attente', locked_at: null })
          .eq('id', pending.id);
      }
    }
  }

  if (scanError) {
    return NextResponse.json(
      { error: 'Analyse impossible.', reportsRetried, reportsResolved },
      { status: 500 },
    );
  }

  return NextResponse.json({ ...scanPayload, reportsRetried, reportsResolved });
}
