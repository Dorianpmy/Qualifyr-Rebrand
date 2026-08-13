import { NextResponse } from 'next/server';
import {
  exchangeMagicToken,
  setSessionCookies,
} from '@/lib/detailing/session';

export async function POST(request: Request) {
  let body: {
    accessToken?: string;
    refreshToken?: string;
    tokenHash?: string;
    type?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: 'Requête invalide.' }, { status: 400 });
  }

  if (body.accessToken && body.refreshToken) {
    await setSessionCookies(body.accessToken, body.refreshToken);
    return NextResponse.json({ ok: true });
  }

  if (body.tokenHash) {
    const session = await exchangeMagicToken(body.tokenHash, body.type ?? 'email');
    if (!session?.access_token || !session.refresh_token) {
      return NextResponse.json({ ok: false, message: 'Token expiré ou invalide.' }, { status: 400 });
    }
    await setSessionCookies(session.access_token, session.refresh_token);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, message: 'Tokens manquants.' }, { status: 400 });
}
