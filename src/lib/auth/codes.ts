import 'server-only';
import { db, num, str } from '../db';
import { hashLoginCode, normalizeEmail, safeEqual } from './tokens';

export const LOGIN_CODE_TTL_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const CODES_PER_HOUR = 3;

/** Un cod nou, sau false dacă adresa a cerut deja prea multe în ultima oră. */
export async function issueLoginCode(email: string, code: string): Promise<boolean> {
  const e = normalizeEmail(email);
  const [{ n }] = await db()`
    SELECT count(*)::int AS n FROM login_codes WHERE email = ${e} AND created_at > now() - interval '1 hour'
  `;
  if (num(n) >= CODES_PER_HOUR) return false;
  const hash = await hashLoginCode(e, code);
  await db()`
    INSERT INTO login_codes (email, code_hash, expires_at)
    VALUES (${e}, ${hash}, now() + make_interval(mins => ${LOGIN_CODE_TTL_MINUTES}))
  `;
  return true;
}

/** Verifică pe cel mai nou cod valid al adresei; maximum 5 încercări pe cod. */
export async function consumeLoginCode(email: string, code: string): Promise<'ok' | 'gresit' | 'expirat'> {
  const e = normalizeEmail(email);
  const [row] = await db()`
    SELECT id, code_hash, attempts FROM login_codes
    WHERE email = ${e} AND used_at IS NULL AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1
  `;
  if (!row || num(row.attempts) >= MAX_ATTEMPTS) return 'expirat';
  const hash = await hashLoginCode(e, code);
  if (!safeEqual(hash, str(row.code_hash))) {
    await db()`UPDATE login_codes SET attempts = attempts + 1 WHERE id = ${row.id}`;
    return 'gresit';
  }
  await db()`UPDATE login_codes SET used_at = now() WHERE id = ${row.id}`;
  return 'ok';
}

/** Întoarcerea după login rămâne pe site: doar căi relative, fără „//”. */
export function safeNext(next: unknown): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return '/app';
  return next;
}
