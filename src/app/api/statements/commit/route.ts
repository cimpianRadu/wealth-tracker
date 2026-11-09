import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { currentUser } from '@/lib/auth/session';
import { findMembership } from '@/lib/household';
import { sanitizeDraft, type DraftTx } from '@/lib/ai/extract';
import { normalizeMerchant } from '@/lib/insights';
import { db, isoDate, num, str } from '@/lib/db';

// Salvează ciorna verificată. Sare peste tranzacțiile care există deja (același
// membru, zi, sumă și monedă): așa o plată „în așteptare” din extrasul lunii
// trecute nu se mai numără a doua oară când apare decontată luna asta.

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Nu ești autentificat.' }, { status: 401 });
  const membership = await findMembership(user.id);
  if (!membership) return NextResponse.json({ error: 'Nu faci parte dintr-o gospodărie.' }, { status: 403 });
  const { household } = membership;

  const body = (await request.json().catch(() => null)) as {
    fileName?: unknown;
    bank?: unknown;
    period?: unknown;
    transactions?: unknown;
  } | null;
  const txs = sanitizeDraft(body?.transactions, household.rates);
  const period = /^\d{4}-\d{2}$/.test(String(body?.period)) ? String(body!.period) : null;
  if (!period || !txs.length) return NextResponse.json({ error: 'Nu sunt tranzacții de salvat.' }, { status: 400 });

  const dates = txs.map((t) => t.date).sort();
  const from = shiftDays(dates[0], -3);
  const to = shiftDays(dates[dates.length - 1], 3);
  const existing = await db()`
    SELECT id, tx_date, amount, currency, merchant, pending FROM transactions
    WHERE household_id = ${household.id} AND member_id = ${user.id} AND tx_date BETWEEN ${from} AND ${to}
  `;
  const index = new Map<string, { id: string; pending: boolean; merchant: string }[]>();
  for (const r of existing) {
    const key = `${isoDate(r.tx_date)}|${num(r.amount).toFixed(2)}|${str(r.currency)}`;
    const arr = index.get(key) ?? [];
    arr.push({ id: str(r.id), pending: r.pending === true, merchant: normalizeMerchant(str(r.merchant)) });
    index.set(key, arr);
  }

  const fresh: DraftTx[] = [];
  const settle: string[] = [];
  let skipped = 0;
  for (const t of txs) {
    const key = `${t.date}|${t.amount.toFixed(2)}|${t.currency}`;
    const matches = index.get(key);
    const m = matches?.find((x) => x.pending || t.pending || x.merchant === normalizeMerchant(t.merchant));
    if (m) {
      skipped++;
      if (m.pending && !t.pending) settle.push(m.id);
      matches!.splice(matches!.indexOf(m), 1);
      continue;
    }
    fresh.push(t);
  }

  // Conturile se creează după eticheta venită din extras.
  const labels = [...new Set(fresh.map((t) => `${t.account}|${t.currency}`))];
  const accountIds = new Map<string, string>();
  for (const l of labels) {
    const [label, currency] = l.split('|');
    const [row] = await db()`
      INSERT INTO accounts (household_id, owner_id, label, currency)
      VALUES (${household.id}, ${user.id}, ${label}, ${currency})
      ON CONFLICT (household_id, owner_id, label, currency) DO UPDATE SET label = EXCLUDED.label
      RETURNING id
    `;
    accountIds.set(l, str(row.id));
  }

  const [statement] = await db()`
    INSERT INTO statements (household_id, uploaded_by, period, file_name, bank, tx_count, skipped_duplicates)
    VALUES (${household.id}, ${user.id}, ${period}, ${String(body?.fileName ?? 'extras.pdf').slice(0, 120)},
            ${String(body?.bank ?? '').slice(0, 40) || null}, ${fresh.length}, ${skipped})
    RETURNING id
  `;

  if (fresh.length) {
    // Un singur INSERT cu unnest, nu sute de cereri HTTP.
    await db().query(
      `INSERT INTO transactions
        (household_id, member_id, statement_id, account_id, tx_date, description, merchant, amount, currency,
         amount_base, direction, kind, category, pending)
       SELECT $1, $2, $3, a, d, de, me, am, cu, ab, di, ki, ca, pe
       FROM unnest($4::uuid[], $5::date[], $6::text[], $7::text[], $8::numeric[], $9::text[], $10::numeric[],
                   $11::text[], $12::text[], $13::text[], $14::boolean[])
         AS x(a, d, de, me, am, cu, ab, di, ki, ca, pe)`,
      [
        household.id,
        user.id,
        statement.id,
        fresh.map((t) => accountIds.get(`${t.account}|${t.currency}`) ?? null),
        fresh.map((t) => t.date),
        fresh.map((t) => t.description),
        fresh.map((t) => t.merchant),
        fresh.map((t) => t.amount),
        fresh.map((t) => t.currency),
        fresh.map((t) => t.amountBase),
        fresh.map((t) => t.direction),
        fresh.map((t) => t.kind),
        fresh.map((t) => t.category),
        fresh.map((t) => t.pending),
      ],
    );
  }
  if (settle.length) {
    await db()`UPDATE transactions SET pending = false WHERE household_id = ${household.id} AND id = ANY(${settle}::uuid[])`;
  }

  revalidatePath('/app', 'layout');
  return NextResponse.json({ ok: true, saved: fresh.length, skipped, period });
}

function shiftDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
