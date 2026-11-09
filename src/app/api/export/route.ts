import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { findMembership, toTx } from '@/lib/household';
import { db } from '@/lib/db';

// GDPR, dreptul de acces: tot ce ținem despre utilizator, ca fișier JSON.

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Nu ești autentificat.' }, { status: 401 });
  const m = await findMembership(user.id);
  const txs = m
    ? await db()`
        SELECT t.*, a.label AS account_label FROM transactions t LEFT JOIN accounts a ON a.id = t.account_id
        WHERE t.household_id = ${m.household.id} AND t.member_id = ${user.id} ORDER BY t.tx_date`
    : [];
  const statements = m
    ? await db()`SELECT period, file_name, bank, tx_count, created_at FROM statements WHERE household_id = ${m.household.id} AND uploaded_by = ${user.id}`
    : [];
  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), user, household: m?.household ?? null, statements, transactions: txs.map(toTx) },
    null,
    2,
  );
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="wealthtracker-date.json"',
    },
  });
}
