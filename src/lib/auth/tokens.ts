// Tokenuri semnate HMAC și coduri de 6 cifre, după modelul din portalul de pe
// instalatori-fotovoltaice.ro: fără parole, sesiunea e un token în cookie
// httpOnly, iar codul de pe email nu se ține nicăieri în clar.
// Numai API-uri web standard, ca să meargă pe orice runtime.

const encoder = new TextEncoder();

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function base64UrlEncode(s: string): string {
  const bytes = encoder.encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(s: string): string | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

let cachedSecret: Promise<string> | null = null;

/**
 * Cheia HMAC: din AUTH_SECRET dacă e setat, altfel una aleatoare generată o
 * singură dată și ținută în tabelul app_secrets. Așa aplicația pornește fără
 * niciun secret configurat de mână, iar sesiunile rămân valabile între deploy-uri.
 */
export function authSecret(): Promise<string> {
  const env = process.env.AUTH_SECRET;
  if (env && env.length >= 32) return Promise.resolve(env);
  if (!cachedSecret) {
    cachedSecret = loadOrCreateSecret().catch((err) => {
      cachedSecret = null;
      throw err;
    });
  }
  return cachedSecret;
}

async function loadOrCreateSecret(): Promise<string> {
  const { db, str } = await import('../db');
  // ON CONFLICT: dacă două instanțe pornesc deodată, câștigă prima, iar ambele citesc aceeași valoare.
  await db()`INSERT INTO app_secrets (name, value) VALUES ('auth', ${randomToken(48)}) ON CONFLICT (name) DO NOTHING`;
  const [row] = await db()`SELECT value FROM app_secrets WHERE name = 'auth'`;
  const value = str(row?.value);
  if (value.length < 32) throw new Error('Cheia de semnare din app_secrets lipsește.');
  return value;
}

/** `kind` separă întrebuințările: un token de alt fel nu trece drept sesiune. */
export interface TokenPayload {
  kind: 'session' | 'oauth-state';
  /** Pe `session`: id-ul utilizatorului. Pe `oauth-state`: nonce. */
  sub: string;
  /** Unix ms. */
  exp: number;
  /** Pe `oauth-state`: unde revine utilizatorul după login. */
  next?: string;
}

export async function createToken(payload: TokenPayload): Promise<string> {
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = await hmacHex(await authSecret(), body);
  return `${body}.${sig}`;
}

export async function verifyToken(
  token: string | undefined,
  kind: TokenPayload['kind'],
): Promise<TokenPayload | null> {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot === -1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, await hmacHex(await authSecret(), body))) return null;
  const json = base64UrlDecode(body);
  if (!json) return null;
  try {
    const payload = JSON.parse(json) as TokenPayload;
    if (payload.kind !== kind) return null;
    if (typeof payload.sub !== 'string' || !payload.sub) return null;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(s: string): boolean {
  return EMAIL_RE.test(s.trim());
}

/** Cod de 6 cifre din CSPRNG, cu respingere pe interval ca distribuția să fie uniformă. */
export function generateLoginCode(): string {
  const range = 900_000;
  const limit = Math.floor(0xffffffff / range) * range;
  const buf = new Uint32Array(1);
  let v: number;
  do {
    crypto.getRandomValues(buf);
    v = buf[0];
  } while (v >= limit);
  return String(100_000 + (v % range));
}

export async function hashLoginCode(email: string, code: string): Promise<string> {
  return hmacHex(await authSecret(), `code:${normalizeEmail(email)}:${code}`);
}

/** Tokenul din linkul de invitație: aleator, în DB ținem doar hash-ul lui. */
export function randomToken(bytes = 24): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let bin = '';
  for (const b of buf) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function hashInviteToken(token: string): Promise<string> {
  return hmacHex(await authSecret(), `invite:${token}`);
}

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}
