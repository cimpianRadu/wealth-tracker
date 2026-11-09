import { NextResponse } from 'next/server';
import { cookieOptions, createToken, randomToken } from '@/lib/auth/tokens';
import { safeNext } from '@/lib/auth/codes';
import { OAUTH_STATE_COOKIE, appUrl } from '@/lib/auth/google';

// Login cu Google prin OAuth 2.0 (authorization code), fără bibliotecă.
// `state` e un token semnat pus și în cookie, verificat la întoarcere.

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL('/intra?eroare=google', request.url));
  }
  const next = safeNext(new URL(request.url).searchParams.get('next'));
  const state = await createToken({ kind: 'oauth-state', sub: randomToken(16), exp: Date.now() + 10 * 60_000, next });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl(request)}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  res.cookies.set(OAUTH_STATE_COOKIE, state, cookieOptions(600));
  return res;
}
