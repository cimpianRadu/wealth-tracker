'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db, num, str } from '../db';
import { requireUser } from '../auth/session';
import { hashInviteToken, randomToken } from '../auth/tokens';
import { findMembership, requireMembership } from '../household';
import { CATEGORY_IDS, toBase, type Kind } from '../model';

function text(form: FormData, key: string, max = 80): string {
  return String(form.get(key) ?? '').trim().slice(0, max);
}

export async function createHousehold(form: FormData) {
  const user = await requireUser();
  if (await findMembership(user.id)) redirect('/app');
  const name = text(form, 'household') || 'Casa noastră';
  const displayName = text(form, 'name', 40) || user.name || user.email.split('@')[0];
  const [h] = await db()`INSERT INTO households (name) VALUES (${name}) RETURNING id`;
  await db()`
    INSERT INTO household_members (household_id, user_id, role, display_name)
    VALUES (${h.id}, ${user.id}, 'owner', ${displayName})
  `;
  redirect('/app/setari?nou=1');
}

const INVITE_DAYS = 7;

/** Un link de invitație nou, valabil 7 zile. Tokenul în clar apare doar aici. */
export async function createInvite(): Promise<{ url: string } | { error: string }> {
  const { user, household } = await requireMembership();
  const token = randomToken();
  const hash = await hashInviteToken(token);
  await db()`
    INSERT INTO invites (household_id, token_hash, created_by, expires_at)
    VALUES (${household.id}, ${hash}, ${user.id}, now() + make_interval(days => ${INVITE_DAYS}))
  `;
  const base = process.env.APP_URL?.replace(/\/$/, '') ?? '';
  return { url: `${base}/invitatie/${token}` };
}

export async function acceptInvite(form: FormData) {
  const user = await requireUser();
  const token = text(form, 'token', 100);
  const displayName = text(form, 'name', 40) || user.name || user.email.split('@')[0];
  if (await findMembership(user.id)) redirect('/app');
  const hash = await hashInviteToken(token);
  const [inv] = await db()`
    SELECT id, household_id FROM invites
    WHERE token_hash = ${hash} AND accepted_at IS NULL AND expires_at > now()
  `;
  if (!inv) redirect(`/invitatie/${token}?eroare=expirat`);
  await db().transaction([
    db()`INSERT INTO household_members (household_id, user_id, role, display_name)
         VALUES (${inv.household_id}, ${user.id}, 'member', ${displayName}) ON CONFLICT DO NOTHING`,
    db()`UPDATE invites SET accepted_by = ${user.id}, accepted_at = now() WHERE id = ${inv.id}`,
  ]);
  redirect('/app');
}

function rate(form: FormData, key: string, fallback: number): number {
  const v = Number(String(form.get(key) ?? '').replace(',', '.'));
  return Number.isFinite(v) && v > 0 && v < 100 ? v : fallback;
}

export async function updateHousehold(form: FormData) {
  const { household } = await requireMembership();
  const name = text(form, 'household') || household.name;
  const due = Math.min(28, Math.max(1, Math.round(Number(form.get('dueDay')) || household.dueDay)));
  const partner = form.get('partnerTransfers') === 'internal' ? 'internal' : 'expense';
  await db()`
    UPDATE households SET
      name = ${name},
      statement_due_day = ${due},
      usd_rate = ${rate(form, 'usd', household.rates.USD)},
      eur_rate = ${rate(form, 'eur', household.rates.EUR)},
      gbp_rate = ${rate(form, 'gbp', household.rates.GBP)},
      partner_transfers = ${partner}
    WHERE id = ${household.id}
  `;
  revalidatePath('/app', 'layout');
}

/** Fiecare își modifică propriul profil; ownerul poate modifica și bugetul celorlalți. */
export async function updateMember(form: FormData) {
  const { user, household, role } = await requireMembership();
  const target = text(form, 'userId', 60) || user.id;
  if (target !== user.id && role !== 'owner') return;
  const displayName = text(form, 'name', 40);
  const budgetRaw = String(form.get('budget') ?? '').replace(',', '.').trim();
  const budget = budgetRaw === '' ? null : Math.max(0, Number(budgetRaw) || 0);
  const currency = ['RON', 'EUR', 'USD'].includes(String(form.get('budgetCurrency'))) ? String(form.get('budgetCurrency')) : 'RON';
  const aliases = String(form.get('aliases') ?? '')
    .split(/[\n,]/)
    .map((a) => a.trim())
    .filter(Boolean)
    .slice(0, 10);
  await db()`
    UPDATE household_members SET
      display_name = COALESCE(NULLIF(${displayName}, ''), display_name),
      monthly_budget = ${budget},
      budget_currency = ${currency},
      aliases = ${aliases}
    WHERE household_id = ${household.id} AND user_id = ${target}
  `;
  revalidatePath('/app', 'layout');
}

export async function removeMember(form: FormData) {
  const { user, household, role } = await requireMembership();
  const target = text(form, 'userId', 60);
  if (role !== 'owner' || !target || target === user.id) return;
  await db()`DELETE FROM household_members WHERE household_id = ${household.id} AND user_id = ${target} AND role <> 'owner'`;
  revalidatePath('/app', 'layout');
}

/** Corectura unei tranzacții: categorie sau fel. Recalculează și suma în RON. */
export async function updateTransaction(id: string, patch: { category?: string; kind?: Kind }) {
  const { household } = await requireMembership();
  const [row] = await db()`SELECT amount, currency FROM transactions WHERE id = ${id} AND household_id = ${household.id}`;
  if (!row) return;
  const category = patch.category && (CATEGORY_IDS as string[]).includes(patch.category) ? patch.category : null;
  const kinds: Kind[] = ['expense', 'income', 'own_transfer', 'fx', 'investment', 'refund'];
  const kind = patch.kind && kinds.includes(patch.kind) ? patch.kind : null;
  const base = toBase(num(row.amount), str(row.currency), household.rates);
  await db()`
    UPDATE transactions SET
      category = COALESCE(${category}, category),
      kind = COALESCE(${kind}, kind),
      amount_base = ${base}
    WHERE id = ${id} AND household_id = ${household.id}
  `;
  revalidatePath('/app', 'layout');
}

export async function deleteTransaction(id: string) {
  const { household } = await requireMembership();
  await db()`DELETE FROM transactions WHERE id = ${id} AND household_id = ${household.id}`;
  revalidatePath('/app', 'layout');
}

/** Șterge un extras și toate tranzacțiile venite din el. */
export async function deleteStatement(form: FormData) {
  const { household } = await requireMembership();
  const id = text(form, 'id', 60);
  await db()`DELETE FROM statements WHERE id = ${id} AND household_id = ${household.id}`;
  revalidatePath('/app', 'layout');
}

/**
 * GDPR: șterge contul și datele utilizatorului. Dacă e ultimul membru, pleacă
 * toată gospodăria; altfel rămân doar datele celorlalți.
 */
export async function deleteMyAccount(form: FormData) {
  const { user, household } = await requireMembership();
  if (String(form.get('confirm') ?? '').trim().toUpperCase() !== 'STERGE') return;
  const [{ n }] = await db()`SELECT count(*)::int AS n FROM household_members WHERE household_id = ${household.id}`;
  if (num(n) <= 1) {
    await db()`DELETE FROM households WHERE id = ${household.id}`;
  } else {
    // Dacă pleacă ownerul, rolul trece la cel mai vechi membru rămas.
    await db().transaction([
      db()`DELETE FROM transactions WHERE household_id = ${household.id} AND member_id = ${user.id}`,
      db()`DELETE FROM household_members WHERE household_id = ${household.id} AND user_id = ${user.id}`,
      db()`UPDATE household_members SET role = 'owner' WHERE household_id = ${household.id} AND user_id = (
             SELECT user_id FROM household_members WHERE household_id = ${household.id} ORDER BY joined_at LIMIT 1)
           AND NOT EXISTS (SELECT 1 FROM household_members WHERE household_id = ${household.id} AND role = 'owner')`,
    ]);
  }
  await db()`DELETE FROM users WHERE id = ${user.id}`;
  redirect('/');
}
