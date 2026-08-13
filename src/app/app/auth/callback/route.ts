import { NextResponse } from 'next/server';
import { exchangeMagicToken, setSessionCookies } from '@/lib/detailing/session';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') ?? 'email';
  const origin = url.origin;

  if (!tokenHash) {
    return NextResponse.redirect(`${origin}/app/login?error=link`);
  }

  const session = await exchangeMagicToken(tokenHash, type);
  if (!session?.access_token || !session.refresh_token) {
    return NextResponse.redirect(`${origin}/app/login?error=session`);
  }

  await setSessionCookies(session.access_token, session.refresh_token);
  return NextResponse.redirect(`${origin}/app`);
}
