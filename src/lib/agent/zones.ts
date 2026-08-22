import 'server-only';
import { resolveTransport } from '@/lib/email/transport';
import { getServiceSupabaseClient } from '../detailing/supabase-server';

/**
 * Confirmation immédiate d'une demande de zone (22/08/2026, phase 3 de
 * l'audit growth marketing).
 *
 * Avant ce correctif, rien ne partait entre la demande et le rapport final —
 * qui peut arriver plusieurs heures plus tard selon la position dans la file
 * (`/api/agent/process`, une zone toutes les quinze minutes). Un visiteur qui
 * ne reçoit rien tout de suite ne sait pas si sa demande a été prise en
 * compte. Pas un « bienvenue » au sens propre — il n'y a pas de compte à ce
 * stade — donc le message dit ce qui est vrai : la demande est reçue, le
 * rapport arrive.
 *
 * Best-effort et jamais bloquant : si l'envoi échoue, la demande reste
 * enregistrée, seule la confirmation manque.
 */
async function sendZoneConfirmation(email: string, postalCode: string): Promise<void> {
  const resolution = resolveTransport();
  if (resolution.status !== 'ready') return;

  await resolution.transport.send({
    to: email,
    from: resolution.from,
    subject: `Votre analyse du secteur ${postalCode} est en cours`,
    text: [
      `Votre demande d’analyse autour du ${postalCode} a bien été reçue.`,
      '',
      'Le rapport (nombre d’entreprises identifiées, réparties par type) arrive par e-mail sous quelques heures — le délai dépend du nombre de demandes en cours de traitement.',
      '',
      'Vous recevez ce message parce que vous avez fait une demande sur qualifyragence.com.',
    ].join('\n'),
  });
}

/**
 * Demande de zone — logique partagée entre le formulaire public
 * (`/api/agent/scan`, visiteur anonyme) et l'espace pro (`/api/app/agent-zones`,
 * detailer connecté).
 *
 * **Une seule fonction, deux appelants.** La dédup par (e-mail, code postal) a
 * déjà causé un bug de blocage permanent une fois (voir 09/2026) ; la dupliquer
 * dans deux routes aurait doublé le risque de la corriger dans une seule.
 */

export type RequestZoneInput = {
  readonly email: string;
  readonly postalCode: string;
  readonly radiusKm?: number | undefined;
  /** Présent quand la demande vient de l'espace pro : rattache la zone tout de suite. */
  readonly detailerId?: string | null;
};

export type RequestZoneResult =
  | { readonly ok: true; readonly alreadyRequested: true; readonly status: string }
  | { readonly ok: true; readonly requeued: true }
  | { readonly ok: true; readonly isFree: boolean }
  | { readonly ok: false; readonly status: number; readonly error: string; readonly message?: string };

export async function requestZone(input: RequestZoneInput): Promise<RequestZoneResult> {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return {
      ok: false,
      status: 503,
      error: 'Le service est momentanément indisponible. Réessayez dans un instant.',
    };
  }

  const email = input.email.trim().toLowerCase();
  const zone = input.postalCode.trim();
  const country = zone.length === 4 ? 'CH' : 'FR';

  if (country === 'CH') {
    return {
      ok: false,
      status: 422,
      error: 'zone_non_couverte',
      message:
        'L’analyse de secteur n’est disponible qu’en France pour le moment. Le SaaS de réservation, lui, fonctionne déjà en Suisse.',
    };
  }

  const { data: existing } = await supabase
    .from('agent_zones')
    .select('id, status, detailer_id')
    .eq('email', email)
    .eq('postal_code', zone)
    .maybeSingle();

  if (existing && (existing.status === 'en_attente' || existing.status === 'en_cours')) {
    // Une zone lancée depuis le formulaire public, réclamée ensuite depuis le
    // compte : on la rattache sans relancer l'analyse.
    if (input.detailerId && !existing.detailer_id) {
      await supabase
        .from('agent_zones')
        .update({ detailer_id: input.detailerId })
        .eq('id', existing.id);
    }
    return { ok: true, alreadyRequested: true, status: existing.status };
  }

  if (existing) {
    const { error: requeueError } = await supabase
      .from('agent_zones')
      .update({
        status: 'en_attente',
        error_message: null,
        processed_at: null,
        report_sent_at: null,
        detailer_id: input.detailerId ?? existing.detailer_id,
      })
      .eq('id', existing.id);

    if (requeueError) {
      console.error('[agent/zones] relance impossible', requeueError);
      return {
        ok: false,
        status: 500,
        error: 'La demande n’a pas pu être relancée. Réessayez dans un instant.',
      };
    }

    return { ok: true, requeued: true };
  }

  const { count } = await supabase
    .from('agent_zones')
    .select('id', { count: 'exact', head: true })
    .eq('email', email);

  const isFree = (count ?? 0) === 0;

  const { error } = await supabase.from('agent_zones').insert({
    email,
    postal_code: zone,
    radius_km: input.radiusKm ?? 15,
    country,
    is_free: isFree,
    status: 'en_attente',
    detailer_id: input.detailerId ?? null,
  });

  if (error) {
    console.error('[agent/zones] enregistrement impossible', error);
    return {
      ok: false,
      status: 500,
      error: 'La demande n’a pas pu être enregistrée. Réessayez dans un instant.',
    };
  }

  // `void` : ne retarde pas la réponse au visiteur, et n'échoue jamais (voir
  // `sendZoneConfirmation` — `EmailTransport.send` ne lève pas, elle renvoie
  // un résultat). Seulement sur ce chemin (première demande) : une relance ou
  // une demande déjà en cours ne doit pas renvoyer une seconde confirmation.
  void sendZoneConfirmation(email, zone);

  return { ok: true, isFree };
}
