import { NextResponse } from 'next/server';
import { isValidEmail, normalizeEmail } from '@/lib/auth/tokens';
import { consumeLoginCode, safeNext } from '@/lib/auth/codes';
import { sessionCookie, upsertUser } from '@/lib/auth/session';

// Pasul 2: emailul și codul. Maximum 5 încercări pe cod, apoi trebuie cerut altul.

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown; code?: unknown; next?: unknown } | null;
  const raw = typeof body?.email === 'string' ? body.email : '';
  const code = String(body?.code ?? '').replace(/\s/g, '');
  if (!isValidEmail(raw) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Codul are 6 cifre.' }, { status: 400 });
  }
  const email = normalizeEmail(raw);
  try {
    const result = await consumeLoginCode(email, code);
    if (result === 'gresit') return NextResponse.json({ error: 'Cod greșit. Verifică emailul.' }, { status: 400 });
    if (result === 'expirat') {
      return NextResponse.json({ error: 'Codul a expirat sau a fost încercat de prea multe ori. Cere altul.' }, { status: 400 });
    }
    const userId = await upsertUser(email);
    const res = NextResponse.json({ ok: true, next: safeNext(body?.next) });
    const session = await sessionCookie(userId);
    res.cookies.set(session.name, session.value, session.options);
    return res;
  } catch (err) {
    console.error('[auth] verify:', err);
    return NextResponse.json({ error: 'A apărut o eroare. Încearcă din nou.' }, { status: 500 });
  }
}
