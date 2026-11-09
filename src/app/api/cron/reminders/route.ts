import { NextResponse } from 'next/server';
import { db, num, str } from '@/lib/db';
import { safeEqual } from '@/lib/auth/tokens';
import { sendEmail, statementReminderEmail } from '@/lib/email';
import { todayIso } from '@/lib/household';
import { dayLabel, monthLabel, shiftMonth } from '@/lib/model';

// Rulat zilnic de un scheduler extern (GitHub Actions, .github/workflows/reminders.yml),
// ca aplicația să nu depindă de cron-ul unui hosting anume.
// Trimite reminder cu 2 zile înainte de termen și în ziua termenului, câte
// unul pe membru, lună și fel, doar celor care nu au încărcat încă nimic.

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization') ?? '';
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const today = todayIso();
  const day = Number(today.slice(8, 10));
  const period = shiftMonth(today.slice(0, 7), -1);
  const base = process.env.APP_URL?.replace(/\/$/, '') || new URL(request.url).origin;

  const rows = await db()`
    SELECT h.id AS household_id, h.statement_due_day, m.user_id, m.display_name, u.email
    FROM households h
    JOIN household_members m ON m.household_id = h.id
    JOIN users u ON u.id = m.user_id
    WHERE h.statement_due_day IN (${day}, ${day + 2})
      AND NOT EXISTS (
        SELECT 1 FROM statements s WHERE s.household_id = h.id AND s.uploaded_by = m.user_id AND s.period = ${period}
      )
  `;

  let sent = 0;
  for (const r of rows) {
    const kind = num(r.statement_due_day) === day ? 'due' : 'before';
    const [logged] = await db()`
      INSERT INTO reminder_log (household_id, user_id, period, kind)
      VALUES (${r.household_id}, ${r.user_id}, ${period}, ${kind})
      ON CONFLICT DO NOTHING RETURNING user_id
    `;
    if (!logged) continue;
    const dueDate = `${today.slice(0, 7)}-${String(num(r.statement_due_day)).padStart(2, '0')}`;
    const mail = statementReminderEmail(
      str(r.display_name),
      monthLabel(period),
      kind === 'due' ? 'azi' : dayLabel(dueDate),
      `${base}/app/extrase`,
    );
    const res = await sendEmail(str(r.email), mail.subject, mail.html);
    if (res.ok) sent++;
    else console.error('[cron] reminder:', res.reason);
  }
  return NextResponse.json({ ok: true, candidates: rows.length, sent });
}
