import { NextResponse } from 'next/server';
import { generateLoginCode, isValidEmail, normalizeEmail } from '@/lib/auth/tokens';
import { issueLoginCode } from '@/lib/auth/codes';
import { loginCodeEmail, sendEmail } from '@/lib/email';

// Pasul 1: emailul. Codul pleacă pe orice adresă validă: contul se creează la
// prima intrare, deci nu există adrese „necunoscute” de ascuns.

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const raw = typeof body?.email === 'string' ? body.email : '';
  if (!isValidEmail(raw)) {
    return NextResponse.json({ error: 'Scrie o adresă de email validă.' }, { status: 400 });
  }
  const email = normalizeEmail(raw);
  try {
    const code = generateLoginCode();
    if (!(await issueLoginCode(email, code))) {
      return NextResponse.json(
        { error: 'Ai cerut deja 3 coduri în ultima oră. Folosește-l pe cel mai recent sau încearcă mai târziu.' },
        { status: 429 },
      );
    }
    const mail = loginCodeEmail(code);
    const sent = await sendEmail(email, mail.subject, mail.html);
    if (!sent.ok) {
      console.error('[auth] email cod:', sent.reason);
      return NextResponse.json({ error: 'Nu am putut trimite emailul. Încearcă din nou.' }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[auth] cod:', err);
    return NextResponse.json({ error: 'A apărut o eroare. Încearcă din nou.' }, { status: 500 });
  }
}
