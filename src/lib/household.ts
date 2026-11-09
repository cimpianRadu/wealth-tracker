// Accesul la datele gospodăriei. Orice citire sau scriere trece prin
// requireMembership(), care confirmă că utilizatorul e membru; interogările
// filtrează apoi pe household_id-ul confirmat aici, niciodată pe unul venit din request.

import 'server-only';
import { redirect } from 'next/navigation';
import { db, isoDate, num, str, type Row } from './db';
import { requireUser, type User } from './auth/session';
import type { Household, Member, StatementRow, Tx, Kind } from './model';

export interface Membership {
  user: User;
  household: Household;
  role: 'owner' | 'member';
}

function toHousehold(r: Row): Household {
  return {
    id: str(r.id),
    name: str(r.name),
    baseCurrency: str(r.base_currency),
    rates: { USD: num(r.usd_rate), EUR: num(r.eur_rate), GBP: num(r.gbp_rate) },
    dueDay: num(r.statement_due_day),
    partnerTransfers: str(r.partner_transfers) === 'internal' ? 'internal' : 'expense',
  };
}

export async function findMembership(userId: string): Promise<{ household: Household; role: 'owner' | 'member' } | null> {
  const [row] = await db()`
    SELECT h.*, m.role FROM household_members m
    JOIN households h ON h.id = m.household_id
    WHERE m.user_id = ${userId}
    ORDER BY m.joined_at ASC LIMIT 1
  `;
  if (!row) return null;
  return { household: toHousehold(row), role: str(row.role) === 'owner' ? 'owner' : 'member' };
}

export async function requireMembership(): Promise<Membership> {
  const user = await requireUser();
  const m = await findMembership(user.id);
  if (!m) redirect('/incepe');
  return { user, ...m };
}

export async function loadMembers(householdId: string): Promise<Member[]> {
  const rows = await db()`
    SELECT user_id, role, display_name, monthly_budget, budget_currency, aliases
    FROM household_members WHERE household_id = ${householdId} ORDER BY joined_at ASC
  `;
  return rows.map((r) => ({
    userId: str(r.user_id),
    name: str(r.display_name),
    role: str(r.role) === 'owner' ? 'owner' : 'member',
    monthlyBudget: r.monthly_budget == null ? null : num(r.monthly_budget),
    budgetCurrency: str(r.budget_currency) || 'RON',
    aliases: Array.isArray(r.aliases) ? (r.aliases as string[]) : [],
  }));
}

export function toTx(r: Row): Tx {
  return {
    id: str(r.id),
    date: isoDate(r.tx_date),
    description: str(r.description),
    merchant: str(r.merchant),
    amount: num(r.amount),
    currency: str(r.currency),
    amountBase: num(r.amount_base),
    direction: str(r.direction) === 'in' ? 'in' : 'out',
    kind: str(r.kind) as Kind,
    category: str(r.category),
    pending: r.pending === true,
    memberId: str(r.member_id),
    account: r.account_label ? str(r.account_label) : null,
  };
}

/** Tranzacțiile pe un interval de luni [fromMonth, toMonth], inclusiv. */
export async function loadTransactions(householdId: string, fromMonth: string, toMonth: string): Promise<Tx[]> {
  const from = `${fromMonth}-01`;
  const [y, m] = toMonth.split('-').map(Number);
  const to = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10); // prima zi din luna următoare
  const rows = await db()`
    SELECT t.*, a.label AS account_label FROM transactions t
    LEFT JOIN accounts a ON a.id = t.account_id
    WHERE t.household_id = ${householdId} AND t.tx_date >= ${from} AND t.tx_date < ${to}
    ORDER BY t.tx_date DESC, t.amount_base DESC
  `;
  return rows.map(toTx);
}

export async function loadStatements(householdId: string): Promise<StatementRow[]> {
  const rows = await db()`
    SELECT id, period, file_name, bank, uploaded_by, tx_count, skipped_duplicates, created_at
    FROM statements WHERE household_id = ${householdId} ORDER BY created_at DESC LIMIT 200
  `;
  return rows.map((r) => ({
    id: str(r.id),
    period: str(r.period),
    fileName: str(r.file_name),
    bank: r.bank ? str(r.bank) : null,
    uploadedBy: str(r.uploaded_by),
    txCount: num(r.tx_count),
    skipped: num(r.skipped_duplicates),
    createdAt: str(r.created_at),
  }));
}

/** Plafon zilnic pe apelurile AI ale unui utilizator. */
export async function underAiLimit(userId: string, kind: 'extract' | 'assistant'): Promise<boolean> {
  const limit = kind === 'extract' ? 30 : 150;
  const [row] = await db()`
    SELECT count(*)::int AS n FROM ai_calls
    WHERE user_id = ${userId} AND kind = ${kind} AND created_at > now() - interval '1 day'
  `;
  return num(row.n) < limit;
}

export async function recordAiCall(userId: string, kind: 'extract' | 'assistant'): Promise<void> {
  await db()`INSERT INTO ai_calls (user_id, kind) VALUES (${userId}, ${kind})`;
}

export function todayIso(): string {
  // Ora României, ca termenul pe 5 să nu treacă la 3 noaptea UTC.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest' }).format(new Date());
}
