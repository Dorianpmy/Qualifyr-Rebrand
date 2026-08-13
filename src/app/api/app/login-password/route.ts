import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { detailingPublicEnv } from '@/lib/detailing/env';
import { setSessionCookies } from '@/lib/detailing/session';

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ ok: false, message: 'Requête invalide.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';
  if (!email || !password) {
    return NextResponse.json(
      { ok: false, message: 'E-mail et mot de passe requis.' },
      { status: 400 },
    );
  }

  const env = detailingPublicEnv();
  if (!env) {
    return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 });
  }

  const client = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error?.message === 'Invalid login credentials'
            ? 'E-mail ou mot de passe incorrect.'
            : (error?.message ?? 'Connexion impossible.'),
      },
      { status: 401 },
    );
  }

  await setSessionCookies(data.session.access_token, data.session.refresh_token);

  return NextResponse.json({ ok: true, message: 'Connecté.' });
}
