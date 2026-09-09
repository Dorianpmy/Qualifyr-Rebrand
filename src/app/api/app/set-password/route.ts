import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { setPassword } from '@/lib/detailing/session';
import { clientIp, rateLimit } from '@/lib/rate-limit';

/**
 * Enregistre le mot de passe du compte connecté.
 *
 * **L'autorisation vient du cookie de session, jamais du corps de la
 * requête.** C'est ce qui rend la route sûre sans demander l'ancien mot de
 * passe : seul quelqu'un qui détient une session valide peut la changer, et
 * cette session vient soit d'un lien de récupération reçu par e-mail, soit
 * d'une connexion déjà établie. Accepter un identifiant de compte transmis
 * par le client permettrait de changer le mot de passe de n'importe qui.
 */
const SET_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 10 } as const;

/**
 * Douze caractères, sans autre exigence.
 *
 * Les règles de composition — une majuscule, un chiffre, un caractère spécial
 * — produisent des mots de passe courts et prévisibles que leur auteur note
 * sur un papier. La longueur est le seul critère qui résiste vraiment, et
 * douze caractères laissent la place à une phrase que le professionnel
 * retiendra sans l'écrire.
 */
const MIN_LENGTH = 12;

export async function POST(request: Request) {
  if (!rateLimit(`setpwd:${clientIp(request)}`, SET_RATE_LIMIT)) {
    return NextResponse.json(
      { ok: false, message: 'Trop de tentatives. Réessayez dans quelques minutes.' },
      { status: 429 },
    );
  }

  const jar = await cookies();
  const accessToken = jar.get('sb-access-token')?.value;
  if (!accessToken) {
    return NextResponse.json(
      { ok: false, message: 'Session expirée. Redemandez un lien.' },
      { status: 401 },
    );
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ ok: false, message: 'Requête invalide.' }, { status: 400 });
  }

  const password = body.password ?? '';
  if (password.length < MIN_LENGTH) {
    return NextResponse.json(
      { ok: false, message: `Le mot de passe doit faire au moins ${MIN_LENGTH} caractères.` },
      { status: 400 },
    );
  }

  const result = await setPassword(accessToken, password);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
