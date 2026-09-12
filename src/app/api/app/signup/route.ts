import { NextResponse } from 'next/server';
import { signUpWithPassword } from '@/lib/detailing/session';
import { clientIp, rateLimit } from '@/lib/rate-limit';

/**
 * Création de compte — e-mail et mot de passe.
 *
 * Limite volontairement basse : contrairement à la connexion, chaque appel
 * réussi envoie un e-mail. Sans plafond, un script pourrait faire encaisser
 * des confirmations à des adresses qui n'ont rien demandé.
 */
const SIGNUP_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 } as const;

/** Même longueur minimale que partout ailleurs dans l'espace pro (voir
 * `set-password/route.ts`) : la longueur seule, sans règle de composition. */
const MIN_LENGTH = 12;

export async function POST(request: Request) {
  if (!rateLimit(`signup:${clientIp(request)}`, SIGNUP_RATE_LIMIT)) {
    return NextResponse.json(
      { ok: false, message: 'Trop de tentatives. Réessayez dans quelques minutes.' },
      { status: 429 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ ok: false, message: 'Requête invalide.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';

  if (!email) {
    return NextResponse.json({ ok: false, message: 'E-mail requis.' }, { status: 400 });
  }
  if (password.length < MIN_LENGTH) {
    return NextResponse.json(
      { ok: false, message: `Le mot de passe doit faire au moins ${MIN_LENGTH} caractères.` },
      { status: 400 },
    );
  }

  /* L'origine vient de la requête, jamais d'un champ envoyé par le client —
     comme pour `reset-password` : une adresse forgée détournerait sinon le
     lien de confirmation, donc la session qu'il établit, vers un domaine
     tiers. */
  const origin = new URL(request.url).origin;
  const result = await signUpWithPassword(email, password, `${origin}/app/auth/confirm`);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
