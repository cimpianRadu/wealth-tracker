import { loadMembers, loadTransactions, requireMembership, todayIso } from '@/lib/household';
import { CATEGORIES, KIND_LABELS, formatMoney, monthLabel, shiftMonth, type Kind } from '@/lib/model';
import { TxRow } from './TxRow';

export const metadata = { title: 'Tranzacții · Wealth Tracker' };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ luna?: string; membru?: string; categorie?: string; fel?: string; q?: string }>;
}) {
  const { household } = await requireMembership();
  const sp = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(sp.luna ?? '') ? sp.luna! : shiftMonth(todayIso().slice(0, 7), -1);
  const [members, all] = await Promise.all([loadMembers(household.id), loadTransactions(household.id, month, month)]);
  const q = (sp.q ?? '').trim().toLowerCase();
  const txs = all.filter(
    (t) =>
      (!sp.membru || t.memberId === sp.membru) &&
      (!sp.categorie || t.category === sp.categorie) &&
      (!sp.fel || t.kind === sp.fel) &&
      (!q || t.merchant.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
  );
  const names = new Map(members.map((m) => [m.userId, m.name]));
  const expenses = txs.filter((t) => t.kind === 'expense').reduce((s, t) => s + t.amountBase, 0);
  const months = Array.from({ length: 18 }, (_, i) => shiftMonth(todayIso().slice(0, 7), -i));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Tranzacții</h1>
          <p className="mt-1 text-muted">
            {txs.length} tranzacții · cheltuieli {formatMoney(expenses)}. Schimbările de categorie se salvează imediat.
          </p>
        </div>
      </div>

      <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <select name="luna" defaultValue={month} className="field">
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
        <select name="membru" defaultValue={sp.membru ?? ''} className="field">
          <option value="">Toți membrii</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name}
            </option>
          ))}
        </select>
        <select name="categorie" defaultValue={sp.categorie ?? ''} className="field">
          <option value="">Toate categoriile</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select name="fel" defaultValue={sp.fel ?? ''} className="field">
          <option value="">Toate felurile</option>
          {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
        <input name="q" defaultValue={sp.q ?? ''} placeholder="Caută: Auchan, Netflix…" className="field" />
        <button className="btn">Filtrează</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-2 py-3">Ce</th>
              <th className="px-2 py-3 text-right">Sumă</th>
              <th className="px-2 py-3">Categorie</th>
              <th className="px-2 py-3">Fel</th>
              <th className="px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {txs.map((t) => (
              <TxRow key={t.id} tx={t} memberName={names.get(t.memberId) ?? ''} />
            ))}
          </tbody>
        </table>
        {!txs.length && <p className="px-4 py-8 text-center text-muted">Nicio tranzacție pentru filtrele alese.</p>}
      </div>
    </div>
  );
}
