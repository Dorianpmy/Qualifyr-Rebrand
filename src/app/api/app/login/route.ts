import { NextResponse } from 'next/server';
import { sendMagicLink } from '@/lib/detailing/session';

export async function POST(request: Request) {
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

  const origin = new URL(request.url).origin;
  const redirectTo = body.redirectTo?.startsWith(origin)
    ? body.redirectTo
    : `${origin}/app/auth/confirm`;

  const result = await sendMagicLink(email, redirectTo);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
