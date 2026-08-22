import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';
import { SEGMENTS, countBySegment, scanZone, type Establishment } from '@/lib/agent/sirene';

/**
 * Traitement différé des zones en attente.
 *
 * Appelée par le planificateur, toutes les quinze minutes. Elle prend **une
 * zone à la fois** : une analyse dure une à deux minutes à cause du quota
 * Sirene, et la plupart des hébergeurs coupent une fonction au-delà de
 * quelques minutes. Une zone par passage tient dans tous les cas, et la file
 * se vide au rythme du planificateur.
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
 * traitement pour quatre segments, avec de la marge pour la latence.
 */
export const maxDuration = 60;

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

function reportHtml(input: {
  readonly postalCode: string;
  readonly counts: Record<string, number>;
  readonly total: number;
  readonly samples: readonly Establishment[];
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

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Base indisponible.' }, { status: 503 });
  }

  const { data: zone } = await supabase
    .from('agent_zones')
    .select('id, email, postal_code, radius_km')
    .eq('status', 'en_attente')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!zone) return NextResponse.json({ processed: 0 });

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

    if (establishments.length > 0) {
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

    let reportSent = false;
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey && establishments.length > 0) {
      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from: process.env.BOOKING_FROM_EMAIL ?? 'Qualifyr <onboarding@resend.dev>',
        to: zone.email as string,
        subject: `${establishments.length} professionnels autour du ${zone.postal_code}`,
        html: reportHtml({
          postalCode: zone.postal_code as string,
          counts,
          total: establishments.length,
          samples: establishments,
        }),
      });
      reportSent = !error;
      if (error) console.error('[agent/process] envoi du rapport', error);
    }

    await supabase
      .from('agent_zones')
      .update({
        status: 'termine',
        segments: counts,
        processed_at: new Date().toISOString(),
        report_sent_at: reportSent ? new Date().toISOString() : null,
        error_message: errors.length > 0 ? errors.slice(0, 5).join(' | ') : null,
      })
      .eq('id', zone.id);

    return NextResponse.json({
      processed: 1,
      found: establishments.length,
      reportSent,
      partialErrors: errors.length,
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
