import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { normalizeEmail, safeEqual, verifyToken } from '@/lib/auth/tokens';
import { safeNext } from '@/lib/auth/codes';
import { sessionCookie, upsertUser } from '@/lib/auth/session';
import { OAUTH_STATE_COOKIE, appUrl } from '@/lib/auth/google';

interface GoogleTokenResponse {
  id_token?: string;
  error?: string;
}

interface GoogleIdClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  aud?: string;
  iss?: string;
}

function decodeIdToken(idToken: string): GoogleIdClaims | null {
  // Tokenul vine direct de la endpoint-ul Google prin TLS, deci îl putem citi
  // fără să verificăm semnătura; verificăm totuși audiența și emitentul.
  const part = idToken.split('.')[1];
  if (!part) return null;
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(json, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as GoogleIdClaims;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fail = (why: string) => NextResponse.redirect(new URL(`/intra?eroare=${why}`, request.url));
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') ?? '';
  const jar = await cookies();
  const cookieState = jar.get(OAUTH_STATE_COOKIE)?.value ?? '';
  const payload = await verifyToken(state, 'oauth-state');
  if (!code || !payload || !cookieState || !safeEqual(state, cookieState)) return fail('google');

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail('google');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${appUrl(request)}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  });
  const tokens = (await tokenRes.json().catch(() => ({}))) as GoogleTokenResponse;
  const claims = tokens.id_token ? decodeIdToken(tokens.id_token) : null;
  if (
    !claims?.email ||
    !claims.email_verified ||
    claims.aud !== clientId ||
    !['https://accounts.google.com', 'accounts.google.com'].includes(claims.iss ?? '')
  ) {
    return fail('google');
  }

  const userId = await upsertUser(normalizeEmail(claims.email), claims.name ?? null, claims.sub);
  const res = NextResponse.redirect(new URL(safeNext(payload.next), request.url));
  const session = await sessionCookie(userId);
  res.cookies.set(session.name, session.value, session.options);
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}
