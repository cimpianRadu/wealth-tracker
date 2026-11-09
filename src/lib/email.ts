// Trimitere prin API-ul Resend direct, fără dependență în plus.
// Fără RESEND_API_KEY, în dezvoltare codul de intrare apare în consola serverului.

import 'server-only';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[email dev] către ${to}: ${subject}\n${html.replace(/<[^>]+>/g, ' ')}`);
      return { ok: true };
    }
    return { ok: false, reason: 'RESEND_API_KEY lipsește' };
  }
  const from = process.env.RESEND_FROM || 'Wealth Tracker <onboarding@resend.dev>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) return { ok: false, reason: `Resend ${res.status}: ${await res.text().catch(() => '')}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'eroare necunoscută' };
  }
}

function frame(body: string): string {
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c1917;line-height:1.5">
    <p style="font-size:13px;color:#57534e;margin:0 0 24px">wealthtracker.ro</p>${body}
    <p style="font-size:12px;color:#78716c;margin-top:32px">Primești emailul pentru că ai cont pe wealthtracker.ro.</p></div>`;
}

export function loginCodeEmail(code: string) {
  return {
    subject: `${code} e codul tău de intrare`,
    html: frame(`<p>Codul tău de intrare este:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:16px 0">${code}</p>
      <p>Expiră în 15 minute. Dacă nu tu ai cerut codul, ignoră emailul.</p>`),
  };
}

export function statementReminderEmail(name: string, monthLabel: string, dueLabel: string, link: string) {
  return {
    subject: `Extrasele pe ${monthLabel}: termen ${dueLabel}`,
    html: frame(`<p>Salut ${escapeHtml(name)},</p>
      <p>Mai ai de încărcat extrasele de cont pe ${escapeHtml(monthLabel)}. Termenul stabilit în gospodărie e ${escapeHtml(dueLabel)}.</p>
      <p><a href="${link}" style="display:inline-block;background:#1c1917;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Încarcă extrasele</a></p>`),
  };
}
