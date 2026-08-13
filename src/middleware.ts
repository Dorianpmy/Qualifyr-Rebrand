import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Sur le sous-domaine SaaS, la home ouvre l'espace detailer. */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const { pathname } = request.nextUrl;

  const isSaaSHost =
    host.startsWith('app.qualifyragence.com') ||
    host.startsWith('qualifyr-rebrand-bplf');

  if (isSaaSHost && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/app/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
