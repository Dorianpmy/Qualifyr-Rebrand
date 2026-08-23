import { NextResponse } from 'next/server';

import { suppress } from '@/lib/agent/outreach';
import { logServerEvent } from '@/lib/analytics-server';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';

/**
 * Hermès — rebonds et plaintes.
 *
 * **Pourquoi cette route existe.** Avant elle, une adresse invalide n'était
 * retirée de la circulation que si le message d'erreur *synchrone* de l'envoi
 * ressemblait à `/invalid|not exist|bounce/i` (voir
 * `src/app/api/agent/outreach/route.ts`) — ce qui ne couvre pas les rebonds
 * *différés* (boîte pleine, domaine tombé après acceptation initiale) ni les
 * plaintes (« signaler comme indésirable »), qui n'arrivent jamais en synchrone
 * et n'existaient nulle part avant cette route. Une plainte non traitée, c'est
 * le même destinataire recontacté, et c'est précisément ce qui fait chuter la
 * réputation d'un domaine d'expédition — voir `docs/14-hermes-prompt-claude-code.md`.
 *
 * **Signature Svix, pas de dépendance ajoutée.** Les webhooks Resend sont
 * signés par Svix (en-têtes `svix-id`, `svix-timestamp`, `svix-signature`),
 * mais le paquet `svix` n'apporterait qu'une vérification HMAC que
 * `crypto.subtle` fait déjà — voir `verifyWebhookSignature` dans
 * `src/lib/billing/stripe.ts`, qui applique le même principe pour Stripe. Pas
 * de fonction partagée entre les deux : ce sont deux secrets différents, et le
 * jour où l'un des deux schémas change, ils ne doivent pas se tirer l'un
 * l'autre.
 *
 * **Ce que fait cette route, dans l'ordre.** Elle vérifie la signature (sinon
 * n'importe qui pourrait supprimer ou faire croire à la suppression de
 * n'importe quelle adresse), ignore les types d'événements qu'elle ne traite
 * pas, retrouve le message d'origine par `provider_id` pour tracer le compte
 * à l'origine de l'envoi, mais **l'ajout à la liste de suppression ne dépend
 * jamais de cette traçabilité** : mieux vaut une suppression sans origine
 * connue qu'une adresse qu'on continue de contacter parce que son message
 * d'origine est introuvable.
 *
 * **Idempotence.** Svix garantit « au moins une fois », jamais « exactement
 * une fois ». `suppress` est un `upsert`, et remettre `hermes_messages.status`
 * à la même valeur est sans effet : rejouer le même événement deux fois ne
 * produit rien de plus que le jouer une fois.
 *
 * **Rebond dur contre rebond mou.** Resend classe ses rebonds comme SES, dont
 * il s'appuie sur l'infrastructure : `data.bounce.type` vaut `Permanent`
 * (adresse ou domaine qui n'existe plus — ne reviendra jamais), `Transient`
 * (boîte pleine, serveur momentanément indisponible — peut revenir) ou
 * `Undetermined`. Seul un rebond `Permanent` va sur `hermes_suppressions` :
 * un rebond mou n'y va pas, seulement `hermes_messages.status`. Traiter les
 * deux pareil supprimerait définitivement, pour tous les comptes, une adresse
 * qui n'avait qu'une boîte pleine ce jour-là. Type absent ou non reconnu
 * (Resend fait évoluer sa classification) : traité comme mou — mieux vaut
 * retenter une adresse morte que perdre une adresse vivante par excès de
 * prudence dans le sens inverse de celui qui protège vraiment (voir règle 2
 * de `docs/14-hermes-prompt-claude-code.md`, qui porte sur les vérifications
 * impossibles, pas sur une classification incertaine).
 */

export const dynamic = 'force-dynamic';

type ResendWebhookEvent = {
  readonly type: string;
  readonly data: {
    readonly email_id?: string;
    readonly to?: readonly string[];
    readonly bounce?: {
      readonly type?: string;
      readonly subType?: string;
    };
  };
};

/** Seul ce type de rebond SES/Resend est définitif. */
const HARD_BOUNCE_TYPE = 'Permanent';

const HANDLED_TYPES = new Set(['email.bounced', 'email.complained']);

/**
 * Vérifie qu'un événement porte bien la signature du secret configuré côté
 * Resend, et non celle de n'importe qui d'autre.
 *
 * Schéma Svix : le contenu signé est `{svix-id}.{svix-timestamp}.{payload}`,
 * la clé est la partie du secret après le préfixe `whsec_`, décodée en
 * base64 — pas le secret tel quel, contrairement au schéma Stripe. L'en-tête
 * `svix-signature` peut porter plusieurs signatures séparées par un espace
 * (rotation de secret côté Resend) ; une seule doit correspondre.
 */
async function verifyResendWebhookSignature(input: {
  readonly payload: string;
  readonly svixId: string | null;
  readonly svixTimestamp: string | null;
  readonly svixSignature: string | null;
  readonly secret: string;
  readonly toleranceSeconds?: number;
}): Promise<boolean> {
  const { payload, svixId, svixTimestamp, svixSignature, secret } = input;
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  // Protection contre le rejeu : un événement trop vieux n'est plus accepté,
  // même signé correctement.
  const age = Math.abs(Date.now() / 1000 - Number(svixTimestamp));
  if (!Number.isFinite(age) || age > (input.toleranceSeconds ?? 300)) return false;

  const secretBytes = base64Decode(secret.replace(/^whsec_/, ''));

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${svixId}.${svixTimestamp}.${payload}`),
  );
  const expected = base64Encode(new Uint8Array(digest));

  const candidates = svixSignature
    .split(' ')
    .map((part) => part.split(',')[1])
    .filter((value): value is string => Boolean(value));

  return candidates.some((candidate) => timingSafeEqual(candidate, expected));
}

function base64Decode(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64Encode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request) {
  const secret = process.env['RESEND_WEBHOOK_SECRET'];
  if (!secret) {
    console.error('[hermes/webhook] RESEND_WEBHOOK_SECRET manquante');
    return NextResponse.json({ error: 'Non configuré.' }, { status: 503 });
  }

  // Corps lu en texte brut : la signature porte sur les octets exacts envoyés
  // par Resend, pas sur une re-sérialisation JSON.
  const payload = await request.text();

  const valid = await verifyResendWebhookSignature({
    payload,
    svixId: request.headers.get('svix-id'),
    svixTimestamp: request.headers.get('svix-timestamp'),
    svixSignature: request.headers.get('svix-signature'),
    secret,
  });

  if (!valid) {
    // 400 et non 401 : une signature invalide ne deviendra pas valide au
    // prochain essai, inutile de laisser Resend rejouer.
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 });
  }

  const event = JSON.parse(payload) as ResendWebhookEvent;

  if (!HANDLED_TYPES.has(event.type)) {
    // Accepté sans traitement : un 4xx ou 5xx ferait rejouer Resend en boucle
    // sur des événements qu'on a simplement choisi d'ignorer (email.sent,
    // email.delivered, email.opened…).
    return NextResponse.json({ received: true });
  }

  const recipient = event.data.to?.[0]?.trim().toLowerCase();
  if (!recipient) {
    return NextResponse.json({ received: true, processed: false });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    console.error('[hermes/webhook] base indisponible');
    return NextResponse.json({ error: 'Base indisponible.' }, { status: 503 });
  }

  const reason = event.type === 'email.bounced' ? 'bounced' : 'complained';

  // Une plainte est toujours définitive. Un rebond ne l'est que si Resend le
  // classe `Permanent` : absent ou toute autre valeur (`Transient`,
  // `Undetermined`, ou une classification future non encore connue d'ici)
  // reste un rebond mou — voir le commentaire d'en-tête.
  const isDefinitive = event.type === 'email.complained' || event.data.bounce?.type === HARD_BOUNCE_TYPE;

  // Retrouve le message d'origine par l'identifiant Resend, pour mettre à
  // jour son statut et tracer le compte à l'origine de l'envoi
  // (`source_owner_id`, informatif). Absent ou introuvable : on continue
  // quand même, voir le commentaire d'en-tête.
  let sourceOwnerId: string | null = null;
  if (event.data.email_id) {
    const { data: message } = await supabase
      .from('hermes_messages')
      .select('id, campaign_id')
      .eq('provider_id', event.data.email_id)
      .maybeSingle();

    if (message) {
      await supabase
        .from('hermes_messages')
        .update({ status: reason })
        .eq('id', (message as { id: string }).id);

      const { data: campaign } = await supabase
        .from('hermes_campaigns')
        .select('owner_id')
        .eq('id', (message as { campaign_id: string }).campaign_id)
        .maybeSingle();
      sourceOwnerId = (campaign as { owner_id: string } | null)?.owner_id ?? null;
    }
  }

  // Un rebond mou reste dans `hermes_messages` avec le statut `bounced` (mis
  // à jour ci-dessus) mais ne va pas sur la liste de suppression : l'adresse
  // reste contactable au prochain passage du planificateur.
  if (isDefinitive) {
    await suppress(recipient, reason, sourceOwnerId);
  }

  console.warn(
    `[hermes/webhook] ${event.type}${event.data.bounce?.type ? ` (${event.data.bounce.type})` : ''} traité — adresse ${isDefinitive ? 'supprimée' : 'conservée'}`,
  );
  void logServerEvent({
    eventName: reason === 'bounced' ? 'hermes_bounce_processed' : 'hermes_complaint_processed',
    metadata: { definitive: isDefinitive },
  });

  return NextResponse.json({ received: true, processed: true, suppressed: isDefinitive });
}
