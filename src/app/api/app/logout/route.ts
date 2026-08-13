import { NextResponse } from 'next/server';
import { clearSessionCookies } from '@/lib/detailing/session';

export async function POST(request: Request) {
  await clearSessionCookies();
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/app/login`, { status: 303 });
}
