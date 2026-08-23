import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireCapability } from '@/lib/billing/guard';
import { getServiceSupabaseClient } from '@/lib/detailing/supabase-server';

/**
 * Réglages d'Hermès — création et mise à jour de la campagne.
 *
 * **C'est ici que le professionnel devient expéditeur.** Enregistrer une
 * campagne, c'est accepter que des messages partent en son nom : la route
 * exige donc `agent.prospecting` **en écriture**, et non en simple lecture.
 * Un abonnement résilié peut consulter ses réglages, pas les réactiver.
 *
 * **Le quota est borné côté serveur, pas seulement dans le formulaire.**
 * L'interface propose un curseur jusqu'à 40 ; rien n'empêche d'envoyer 5 000
 * depuis la console du navigateur. La contrainte existe aussi en base, ce qui
 * fait trois barrières — le schéma ici en est la première et la seule qui
 * renvoie un message compréhensible.
 *
 * **`terms_accepted_at` n'est pas modifiable par le client.** La date est
 * posée par le serveur au moment de l'acceptation : une valeur venue du
 * navigateur pourrait être antidatée, et c'est précisément la trace qui
 * établit qui est responsable de quoi en cas de réclamation.
 */

const campaignSchema = z.object({
  senderName: z
    .string()
    .trim()
    .min(2, 'Indiquez le nom qui apparaîtra comme expéditeur.')
    .max(120),
  replyToEmail: z.string().trim().email('Adresse de réponse invalide.').max(160),
  subject: z
    .string()
    .trim()
    .min(5, 'L’objet est trop court.')
    .max(150, 'L’objet est trop long : il sera coupé par les messageries.'),
  body: z
    .string()
    .trim()
    .min(50, 'Le message est trop court pour être crédible.')
    .max(4000, 'Le message est trop long.'),
  dailyQuota: z.coerce.number().int().min(1).max(40),
  /* Acceptation explicite. Sans elle, pas de campagne : c'est le moment où le
     professionnel reconnaît être l'expéditeur des messages. */
  acceptsTerms: z.literal(true, {
    message: 'Vous devez accepter d’être l’expéditeur des messages.',
  }),
});

export async function GET() {
  // Lecture seule : consulter ses réglages reste possible même sans droit
  // d'écriture, sinon un abonné en impayé ne pourrait plus voir ce qui a été
  // envoyé en son nom.
  const guard = await requireCapability('agent.prospecting', { write: false });
  if ('response' in guard) return guard.response;

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'base indisponible' }, { status: 503 });
  }

  const { data } = await supabase
    .from('hermes_campaigns')
    .select('sender_name, reply_to_email, subject, body, daily_quota, paused_at, suspended_at')
    .eq('owner_id', guard.user.id)
    .maybeSingle();

  return NextResponse.json({ campaign: data ?? null });
}

export async function PUT(request: Request) {
  const guard = await requireCapability('agent.prospecting');
  if ('response' in guard) return guard.response;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'corps illisible' }, { status: 400 });
  }

  const parsed = campaignSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: 'validation', message: first?.message ?? 'Formulaire incomplet.' },
      { status: 422 },
    );
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'base indisponible' }, { status: 503 });
  }

  const { data: existing } = await supabase
    .from('hermes_campaigns')
    .select('id, suspended_at')
    .eq('owner_id', guard.user.id)
    .maybeSingle();

  /*
   * Une campagne suspendue par l'administration ne se réactive pas depuis
   * l'écran de réglages. C'est tout l'intérêt d'avoir séparé `paused_at`
   * (l'interrupteur du professionnel) de `suspended_at` (le nôtre) : sans
   * cette distinction, un compte coupé pour abus rouvrirait ses vannes en
   * enregistrant son formulaire.
   */
  if (existing && (existing as { suspended_at: string | null }).suspended_at) {
    return NextResponse.json(
      {
        error: 'suspendue',
        message: 'Cette campagne est suspendue. Contactez-nous pour la rétablir.',
      },
      { status: 403 },
    );
  }

  const values = {
    owner_id: guard.user.id,
    sender_name: parsed.data.senderName,
    reply_to_email: parsed.data.replyToEmail,
    subject: parsed.data.subject,
    body: parsed.data.body,
    daily_quota: parsed.data.dailyQuota,
    // Posée par le serveur, jamais reçue du client.
    terms_accepted_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('hermes_campaigns')
    .upsert(values, { onConflict: 'owner_id' });

  if (error) {
    return NextResponse.json({ error: 'enregistrement impossible' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * Met la campagne en pause, ou la relance.
 *
 * Verbe distinct de `PUT` : arrêter les envois doit être possible en un geste,
 * sans repasser par la validation du formulaire complet. Quelqu'un qui veut
 * couper en urgence ne doit pas être bloqué parce que son objet fait quatre
 * caractères.
 */
export async function PATCH(request: Request) {
  const guard = await requireCapability('agent.prospecting');
  if ('response' in guard) return guard.response;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'corps illisible' }, { status: 400 });
  }

  const parsed = z.object({ paused: z.boolean() }).safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation' }, { status: 422 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'base indisponible' }, { status: 503 });
  }

  const { error } = await supabase
    .from('hermes_campaigns')
    .update({ paused_at: parsed.data.paused ? new Date().toISOString() : null })
    .eq('owner_id', guard.user.id)
    // Une campagne suspendue reste suspendue : la reprise ne doit pas passer
    // par ce chemin.
    .is('suspended_at', null);

  if (error) {
    return NextResponse.json({ error: 'mise à jour impossible' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, paused: parsed.data.paused });
}
