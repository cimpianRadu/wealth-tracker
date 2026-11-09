import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, dbConfigured, str } from '../db';
import { cookieOptions, createToken, verifyToken } from './tokens';

export const SESSION_COOKIE = 'wt_session';
const SESSION_DAYS = 90;

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export async function sessionCookie(userId: string) {
  const token = await createToken({ kind: 'session', sub: userId, exp: Date.now() + SESSION_DAYS * 86_400_000 });
  return { name: SESSION_COOKIE, value: token, options: cookieOptions(SESSION_DAYS * 86_400) };
}

export async function currentUser(): Promise<User | null> {
  if (!dbConfigured()) return null;
  const jar = await cookies();
  const payload = await verifyToken(jar.get(SESSION_COOKIE)?.value, 'session');
  if (!payload) return null;
  const [row] = await db()`SELECT id, email, name FROM users WHERE id = ${payload.sub}`;
  if (!row) return null;
  return { id: str(row.id), email: str(row.email), name: row.name ? str(row.name) : null };
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect('/intra');
  return user;
}

/** Contul se creează la prima intrare, cu email sau Google. */
export async function upsertUser(email: string, name?: string | null, googleSub?: string | null): Promise<string> {
  const [row] = await db()`
    INSERT INTO users (email, name, google_sub, last_seen_at)
    VALUES (${email}, ${name ?? null}, ${googleSub ?? null}, now())
    ON CONFLICT (email) DO UPDATE SET
      name = COALESCE(users.name, EXCLUDED.name),
      google_sub = COALESCE(users.google_sub, EXCLUDED.google_sub),
      last_seen_at = now()
    RETURNING id
  `;
  return str(row.id);
}
