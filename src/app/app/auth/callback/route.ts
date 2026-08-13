import { NextResponse } from 'next/server';

/**
 * Ancienne route serveur — redirige vers la page client qui lit le hash.
 * Les tokens implicit flow arrivent en #access_token=…, illisibles ici.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  // Conserve query éventuelle (token_hash) ; le hash est géré côté page.
  const target = new URL('/app/auth/callback', url.origin);
  url.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });
  return NextResponse.redirect(target);
}
