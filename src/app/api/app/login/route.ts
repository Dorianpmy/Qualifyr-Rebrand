import { NextResponse } from 'next/server';
import { sendMagicLink } from '@/lib/detailing/session';

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ ok: false, message: 'Requête invalide.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !email.includes('@')) {
    return NextResponse.json({ ok: false, message: 'Indiquez une adresse e-mail valide.' }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/app/auth/callback`;
  const result = await sendMagicLink(email, redirectTo);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
