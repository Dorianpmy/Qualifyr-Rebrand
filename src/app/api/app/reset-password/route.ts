import { NextResponse } from 'next/server';
import { sendPasswordReset } from '@/lib/detailing/session';
import { clientIp, rateLimit } from '@/lib/rate-limit';

/**
 * Demande d'un lien de définition de mot de passe.
 *
 * **Même limite de débit que la connexion par mot de passe, pour une raison
 * différente.** Ici il ne s'agit pas de protéger un secret mais d'empêcher
 * qu'on se serve de cette route comme d'une machine à envoyer des e-mails :
 * sans plafond, quelqu'un pourrait déclencher des milliers d'envois depuis le
 * domaine, ce qui abîmerait sa réputation d'expéditeur — celle-là même qu'on
 * construit patiemment pour Hermès.
 *
 * **La réponse est identique que le compte existe ou non** (voir
 * `sendPasswordReset`) : c'est ce qui empêche de s'en servir pour savoir qui
 * est client.
 */
const RESET_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 } as const;

export async function POST(request: Request) {
  if (!rateLimit(`reset:${clientIp(request)}`, RESET_RATE_LIMIT)) {
    return NextResponse.json(
      { ok: false, message: 'Trop de demandes. Réessayez dans quelques minutes.' },
      { status: 429 },
    );
  }

  let body: { email?: string; redirectTo?: string };
  try {
    body = (await request.json()) as { email?: string; redirectTo?: string };
  } catch {
    return NextResponse.json({ ok: false, message: 'Requête invalide.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: false, message: 'E-mail requis.' }, { status: 400 });
  }

  /*
   * `redirectTo` vient du navigateur : il ne doit jamais servir tel quel, sans
   * quoi une adresse forgée renverrait le lien de récupération — donc la
   * session — vers un domaine tiers. Seul le chemin est retenu, et il est
   * imposé ; l'origine est celle de la requête.
   */
  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/app/auth/confirm`;

  const result = await sendPasswordReset(email, redirectTo);
  return NextResponse.json(result);
}
